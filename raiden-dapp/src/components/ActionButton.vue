<template>
  <v-row
    class="action-button"
    no-gutters
    align-content="center"
    justify="center"
    :class="{ sticky: sticky }"
  >
    <v-col :cols="sticky ? 12 : 10" class="text-center">
      <v-btn
        type="submit"
        :disabled="!enabled"
        :loading="loading"
        class="text-capitalize action-button__button"
        :class="{
          sticky: sticky,
          'action-button__button--ghost': ghost,
          'action-button__button--full-width': fullWidth,
        }"
        depressed
        large
        @click="click()"
      >
        {{ text }}
        <v-icon v-if="arrow" right>keyboard_arrow_right</v-icon>
      </v-btn>
    </v-col>
  </v-row>
</template>
<script lang="ts">
import { Component, Emit, Prop, Vue } from 'vue-property-decorator';

@Component({})
export default class ActionButton extends Vue {
  @Prop({ required: true, type: Boolean })
  enabled!: boolean;

  @Prop({ required: true })
  text!: string;

  @Prop({ type: Boolean, default: false })
  loading!: boolean;

  @Prop({ type: Boolean, default: false })
  sticky?: boolean;

  @Prop({ type: Boolean, default: false })
  arrow?: boolean;

  @Prop({ type: Boolean, default: false })
  ghost?: boolean;

  @Prop({ type: Boolean, default: false })
  fullWidth?: boolean;

  @Emit()
  click() {}
}
</script>
<style lang="scss" scoped>
@import '@/scss/colors';
@import '@/scss/mixins';

::v-deep {
  .v-btn {
    letter-spacing: 0 !important;

    &--disabled {
      background-color: $primary-color !important;
    }
  }
}

.action-button {
  &__button {
    max-height: 40px;
    width: 250px;
    border-radius: 29px;
    background-color: $primary-color !important;

    &.sticky {
      width: 100%;
      height: 45px;
      max-height: 45px;
      font-size: 16px;
      border-radius: 0;
      border-bottom-left-radius: 10px;
      border-bottom-right-radius: 10px;

      @include respond-to(handhelds) {
        border-bottom-left-radius: 0;
        border-bottom-right-radius: 0;
      }
    }

    &:hover {
      background-color: rgba($primary-color, 0.8) !important;
    }

    &--full-width {
      width: 100%;
    }

    &--ghost {
      border: 2px solid rgba($primary-color, 0.8);
      background-color: transparent !important;

      &.theme {
        &--dark {
          &.v-btn {
            &.v-btn {
              &--disabled {
                /* stylelint-disable */
                // can't nest class inside nesting
                &:not(.v-btn--icon) {
                  &:not(.v-btn--text) {
                    &:not(.v-btn--outline) {
                      background-color: transparent !important;
                    }
                  }
                }
                /* stylelint-enable */
              }
            }
          }
        }
      }

      &.v-btn {
        &--disabled {
          border-color: $primary-disabled-color;
        }
      }
    }
  }

  &.sticky {
    margin: 0;
    position: absolute;
    bottom: 0;
    left: 0;
    width: 100%;
  }
}

.theme {
  &--dark {
    .v-btn {
      &.v-btn {
        &--disabled {
          /* stylelint-disable */
          // can't nest class inside nesting
          &:not(.v-btn--icon) {
            &:not(.v-btn--text) {
              &:not(.v-btn--outline) {
                background-color: $primary-disabled-color !important;
                color: $disabled-text-color !important;
              }
            }
          }
          /* stylelint-enable */
        }
      }
    }
  }
}
</style>
