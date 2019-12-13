<template>
  <fieldset class="address-input">
    <v-text-field
      id="address-input"
      ref="address"
      :value="address"
      :error-messages="errorMessages"
      :rules="isAddressValid"
      :class="{
        'address-input--invalid': !valid && touched,
        'address-input--untouched': !touched
      }"
      :placeholder="$t('address-input.input.placeholder')"
      persistent-hint
      @blur="$emit('blur')"
      @focus="$emit('focus')"
      @input="updateValue"
      @change="updateValue"
    >
      <template #append>
        <div class="address-input__status__paste-button">
          <v-btn text @click="paste()">
            <span
              class="address-input__status__paste-button__text text-capitalize"
            >
              {{ $t('address-input.paste-button') }}
            </span>
          </v-btn>
        </div>
      </template>
      <template #prepend-inner>
        <div
          v-if="value && isChecksumAddress(value)"
          class="address-input__availability"
          :class="{
            'address-input__availability--online': isAddressAvailable,
            'address-input__availability--offline': !isAddressAvailable
          }"
        >
          <img
            :src="$blockie(value)"
            :alt="$t('address-input.blockie-alt')"
            class="address-input__blockie address-input__prepend"
          />
        </div>
        <div v-else-if="busy">
          <v-progress-circular
            size="22"
            class="address-input__prepend"
            indeterminate
            color="primary"
          ></v-progress-circular>
        </div>
        <div v-else></div>
      </template>
    </v-text-field>
  </fieldset>
</template>

<script lang="ts">
import { Component, Emit, Mixins, Prop, Watch } from 'vue-property-decorator';
import { mapState } from 'vuex';

import { Presences } from '@/model/types';
import AddressUtils from '@/utils/address-utils';
import BlockieMixin from '@/mixins/blockie-mixin';

@Component({ computed: { ...mapState(['presences']) } })
export default class AddressInput extends Mixins(BlockieMixin) {
  @Prop({})
  disabled!: boolean;
  @Prop({ required: true })
  value!: string;

  @Prop({
    default: function() {
      return [''];
    }
  })
  exclude!: Array<string>;

  @Prop({
    default: function() {
      return [''];
    }
  })
  block!: Array<string>;

  address: string = '';

  valid: boolean = false;
  touched: boolean = false;
  errorMessages: string[] = [''];
  busy: boolean = false;
  presences!: Presences;
  isAddressAvailable: boolean = false;

  get isAddressValid() {
    // v-text-field interprets strings returned from a validation rule
    // as the input being invalid. Since the :rules prop does not support
    // async rules we have to workaround with a reactive prop
    const isAddressValid =
      !this.busy && this.errorMessages.length === 0 && this.isAddressAvailable;
    if (isAddressValid) {
      this.input(this.address);
    }

    return [() => isAddressValid || ''];
  }

  mounted() {
    if (this.isChecksumAddress(this.value)) {
      this.address = this.value;
      this.updateValue(this.value);
    }
  }

  @Watch('presences')
  onPresenceUpdate() {
    if (!this.address) {
      return;
    }

    this.updateValue(this.address);
  }

  @Watch('value')
  onChange(value: string) {
    if (value !== this.address && this.isChecksumAddress(value)) {
      this.address = value;
      this.updateValue(value);
    }
  }

  @Emit()
  public input(_value?: string) {}

  isChecksumAddress(address: string): boolean {
    const tokenAddress = address;
    return (
      AddressUtils.isAddress(tokenAddress) &&
      AddressUtils.checkAddressChecksum(tokenAddress)
    );
  }

  updateValue(value?: string) {
    this.errorMessages = [];
    this.updateErrors(value);
    this.checkForErrors();
  }

  private updateErrors(value?: string) {
    if (!value) {
      this.input(value);
      this.errorMessages.push(this.$t('address-input.error.empty') as string);
    } else if (this.exclude.includes(value)) {
      this.errorMessages.push(
        this.$t('address-input.error.invalid-excluded-address') as string
      );
    } else if (this.block.includes(value)) {
      this.errorMessages.push(
        this.$t('address-input.error.channel-not-open') as string
      );
    } else if (
      AddressUtils.isAddress(value) &&
      !AddressUtils.checkAddressChecksum(value)
    ) {
      this.errorMessages.push(
        this.$t('address-input.error.no-checksum') as string
      );
    } else if (
      !AddressUtils.isAddressLike(value) &&
      AddressUtils.isDomain(value)
    ) {
      this.resolveEnsAddress(value);
    } else if (
      AddressUtils.checkAddressChecksum(value) &&
      !(value in this.presences)
    ) {
      this.isAddressAvailable = false;
      this.checkAvailability(value);
      this.input(value);
    } else if (
      AddressUtils.checkAddressChecksum(value) &&
      this.presences[value] === false
    ) {
      this.busy = false;
      this.isAddressAvailable = false;
      this.input(value);
      this.address = value;
      this.errorMessages.push(
        this.$t('address-input.error.target-offline') as string
      );
    } else if (
      AddressUtils.checkAddressChecksum(value) &&
      this.presences[value] === true
    ) {
      this.busy = false;
      this.isAddressAvailable = true;
      this.input(value);
      this.address = value;
    } else {
      this.errorMessages.push(
        this.$t('address-input.error.invalid-address') as string
      );
    }
  }

  private checkForErrors() {
    if (this.$refs.address) {
      this.touched = true;
      this.valid = this.errorMessages.length === 0;
    }
  }

  private async checkAvailability(address: string) {
    this.busy = true;
    await this.$raiden.getAvailability(address);
    this.address = address;
    this.input(address);
    this.updateValue(address);
    this.checkForErrors();
  }

  private async resolveEnsAddress(url: string) {
    let resolvedAddress;
    this.busy = true;

    try {
      resolvedAddress = await this.$raiden.ensResolve(url);
    } catch (e) {
      this.errorMessages.push(
        this.$t('address-input.error.ens-resolve-failed') as string
      );
      this.input(undefined);
      this.checkForErrors();
      return;
    }

    this.busy = false;
    if (resolvedAddress) {
      this.address = resolvedAddress;
      this.updateValue(resolvedAddress);
      this.input(resolvedAddress);
    } else {
      this.errorMessages.push(
        this.$t('address-input.error.ens-resolve-failed') as string
      );
      this.input(undefined);
      this.checkForErrors();
    }
  }

  paste() {}
}
</script>

<style lang="scss" scoped>
@import '../main';
@import '../scss/colors';

.address-input {
  display: flex;
  align-items: center;
  justify-content: center;
  border: 0;

  &__blockie {
    border-radius: 50%;
    box-sizing: border-box;
    height: 22px;
    width: 22px;
    border: 1px solid #979797;
    background-color: #d8d8d8;
  }

  &__availability {
    margin-right: 10px;
    height: 26px;
    width: 26px;
    display: flex;
    justify-content: center;
    align-items: center;
    border-radius: 100%;

    &--online {
      box-shadow: 0 0 0 2px greenyellow;
    }
    &--offline {
      box-shadow: 0 0 0 2px gray;
    }
  }

  @include respond-to(handhelds) {
    padding-top: 30px;
    padding-bottom: 30px;
    border: 0;
  }

  ::v-deep {
    input {
      color: $color-white;
      caret-color: $color-white !important;
      font-family: Roboto, sans-serif;
      font-size: 16px;
      max-height: 49px;

      &:focus {
        outline: 0;
      }
    }

    .v-input {
      &__slot {
        border-radius: 10px;
        background-color: $input-background;
        padding: 8px 8px 8px 16px;
        border: 1.5px solid transparent;
        max-height: 49px;
      }

      &--is-focused {
        .v-input {
          &__slot {
            border: 1.5px solid $primary-color;
          }
        }
      }

      &__prepend-inner {
        margin-top: 0;
      }
    }

    .v-text-field {
      &__details {
        padding-top: 8px;
      }

      > .v-input {
        &__control {
          > .v-input {
            &__slot {
              &::before,
              &::after {
                border-width: 0 0 0 0;
              }
            }
          }
        }
      }
    }

    .v-messages {
      color: #323232 !important;
      font-family: Roboto, sans-serif;
      font-size: 14px;
      line-height: 21px;
      text-align: left;
      border: 1px solid transparent;

      &__wrapper {
        color: $color-white;
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        padding-left: 20px;
        justify-content: center;
      }
    }
  }

  &--invalid {
    ::v-deep {
      .v-messages {
        border: none !important;
        &:after {
          content: ' ';
          position: absolute;
          left: 50%;
          bottom: 90%;
          display: inline-block;
          padding: 3px;
        }
      }
    }
  }

  &--hint-visible {
    ::v-deep {
      .v-text-field {
        &__details {
          padding-top: 0;
          margin-top: 0;
        }
      }
    }
  }

  &--untouched {
    caret-color: white !important;
    color: white !important;
  }

  &__status {
    &__paste-button {
      display: none;
      margin-top: -6px;

      &__text {
        color: $primary-color;
      }
    }
  }
}

$dark_border: #323232;
$dark_background: #323232;
</style>