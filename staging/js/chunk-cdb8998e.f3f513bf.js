(window["webpackJsonp"]=window["webpackJsonp"]||[]).push([["chunk-cdb8998e"],{"4f0f":function(t,e,n){"use strict";var r=n("eae7"),o=n.n(r);o.a},5876:function(t,e,n){"use strict";n.r(e);var r=function(){var t=this,e=t.$createElement,n=t._self._c||e;return n("lazy-route",[n("select-hub")],1)},o=[],c=n("9ab4"),i=n("60a3"),a=function(){var t=this,e=t.$createElement,n=t._self._c||e;return n("v-form",{ref:"form",staticClass:"select-hub",attrs:{autocomplete:"off"},on:{submit:function(e){return e.preventDefault(),t.selectHub()}},model:{value:t.valid,callback:function(e){t.valid=e},expression:"valid"}},[n("v-row",{staticClass:"udc-balance__container",attrs:{justify:"center","align-content":"center","no-gutters":""}},[n("v-col",{attrs:{cols:"10"}},[n("span",{staticClass:"udc-balance__amount",class:{"low-balance":!t.hasEnoughServiceTokens}},[n("amount-display",{attrs:{"exact-amount":"",amount:t.udcCapacity,token:t.udcToken}}),n("v-text-field",{staticClass:"d-none",attrs:{rules:[function(){return t.hasEnoughServiceTokens||""}],required:""},model:{value:t.udcCapacity,callback:function(e){t.udcCapacity=e},expression:"udcCapacity"}})],1),n("v-tooltip",{attrs:{bottom:""},scopedSlots:t._u([{key:"activator",fn:function(e){var r=e.on;return[n("v-btn",t._g({staticClass:"udc-balance__deposit",attrs:{text:"",icon:"","x-large":""},on:{click:function(e){t.showUdcDeposit=!0}}},r),[n("v-icon",{attrs:{color:"primary"}},[t._v("play_for_work")])],1)]}}])},[n("span",[t._v(" "+t._s(t.$t(t.mainnet?"select-hub.service-token-tooltip-main":"select-hub.service-token-tooltip",{token:t.serviceToken}))+" ")])]),n("udc-deposit-dialog",{attrs:{visible:t.showUdcDeposit},on:{cancel:function(e){t.showUdcDeposit=!1},done:function(e){return t.mintDone()}}})],1)],1),n("v-row",{staticClass:"udc-balance__container",attrs:{justify:"center","no-gutters":""}},[n("v-col",{attrs:{cols:"10"}},[t.hasEnoughServiceTokens?n("span",{staticClass:"udc-balance__description"},[t._v(" "+t._s(t.$t("select-hub.service-token-description"))+" ")]):n("span",{staticClass:"udc-balance__description low-balance"},[t._v(" "+t._s(t.$t("select-hub.service-token-balance-too-low",{token:t.serviceToken}))+" ")])])],1),n("v-row",{attrs:{align:"center",justify:"center","no-gutters":""}},[n("v-col",{attrs:{cols:"10"}},[n("address-input",{attrs:{value:t.partner,exclude:[t.token.address,t.defaultAccount]},model:{value:t.partner,callback:function(e){t.partner=e},expression:"partner"}})],1)],1),n("divider"),n("token-information",{attrs:{token:t.token}}),n("action-button",{attrs:{enabled:t.valid,text:t.$t("select-hub.select-button")}})],1)},u=[],s=n("4795"),l=n.n(s),f=n("13ea"),p=n.n(f),d=n("2f62"),b=n("8404"),y=n("6fc3"),v=n("fc09"),h=n("03af"),m=n("152b"),g=n("01f0"),w=n("8716"),O=n("750b"),k=n("7688");function _(t){return _="function"===typeof Symbol&&"symbol"===typeof Symbol.iterator?function(t){return typeof t}:function(t){return t&&"function"===typeof Symbol&&t.constructor===Symbol&&t!==Symbol.prototype?"symbol":typeof t},_(t)}function j(t,e){var n=Object.keys(t);if(Object.getOwnPropertySymbols){var r=Object.getOwnPropertySymbols(t);e&&(r=r.filter((function(e){return Object.getOwnPropertyDescriptor(t,e).enumerable}))),n.push.apply(n,r)}return n}function x(t){for(var e=1;e<arguments.length;e++){var n=null!=arguments[e]?arguments[e]:{};e%2?j(Object(n),!0).forEach((function(e){T(t,e,n[e])})):Object.getOwnPropertyDescriptors?Object.defineProperties(t,Object.getOwnPropertyDescriptors(n)):j(Object(n)).forEach((function(e){Object.defineProperty(t,e,Object.getOwnPropertyDescriptor(n,e))}))}return t}function T(t,e,n){return e in t?Object.defineProperty(t,e,{value:n,enumerable:!0,configurable:!0,writable:!0}):t[e]=n,t}function C(t,e,n,r,o,c,i){try{var a=t[c](i),u=a.value}catch(s){return void n(s)}a.done?e(u):Promise.resolve(u).then(r,o)}function P(t){return function(){var e=this,n=arguments;return new Promise((function(r,o){var c=t.apply(e,n);function i(t){C(c,r,o,i,a,"next",t)}function a(t){C(c,r,o,i,a,"throw",t)}i(void 0)}))}}function D(t,e){if(!(t instanceof e))throw new TypeError("Cannot call a class as a function")}function S(t,e){for(var n=0;n<e.length;n++){var r=e[n];r.enumerable=r.enumerable||!1,r.configurable=!0,"value"in r&&(r.writable=!0),Object.defineProperty(t,r.key,r)}}function R(t,e,n){return e&&S(t.prototype,e),n&&S(t,n),t}function $(t,e){if("function"!==typeof e&&null!==e)throw new TypeError("Super expression must either be null or a function");t.prototype=Object.create(e&&e.prototype,{constructor:{value:t,writable:!0,configurable:!0}}),e&&E(t,e)}function E(t,e){return E=Object.setPrototypeOf||function(t,e){return t.__proto__=e,t},E(t,e)}function V(t){var e=H();return function(){var n,r=B(t);if(e){var o=B(this).constructor;n=Reflect.construct(r,arguments,o)}else n=r.apply(this,arguments);return U(this,n)}}function U(t,e){return!e||"object"!==_(e)&&"function"!==typeof e?A(t):e}function A(t){if(void 0===t)throw new ReferenceError("this hasn't been initialised - super() hasn't been called");return t}function H(){if("undefined"===typeof Reflect||!Reflect.construct)return!1;if(Reflect.construct.sham)return!1;if("function"===typeof Proxy)return!0;try{return Date.prototype.toString.call(Reflect.construct(Date,[],(function(){}))),!0}catch(t){return!1}}function B(t){return B=Object.setPrototypeOf?Object.getPrototypeOf:function(t){return t.__proto__||Object.getPrototypeOf(t)},B(t)}var F=function(t){$(n,t);var e=V(n);function n(){var t;return D(this,n),t=e.apply(this,arguments),t.partner="",t.valid=!0,t.showUdcDeposit=!1,t.udcCapacity=b["Zero"],t.hasEnoughServiceTokens=!1,t}return R(n,[{key:"mounted",value:function(){var t=P(l.a.mark((function t(){return l.a.wrap((function(t){while(1)switch(t.prev=t.next){case 0:return t.next=2,this.updateUDCCapacity();case 2:case"end":return t.stop()}}),t,this)})));function e(){return t.apply(this,arguments)}return e}()},{key:"selectHub",value:function(){this.navigateToOpenChannel(this.token.address,this.partner)}},{key:"updateUDCCapacity",value:function(){var t=P(l.a.mark((function t(){var e;return l.a.wrap((function(t){while(1)switch(t.prev=t.next){case 0:return e=this.$raiden.monitoringReward,t.next=3,this.$raiden.getUDCCapacity();case 3:this.udcCapacity=t.sent,this.hasEnoughServiceTokens=!(!e||!this.udcCapacity.gte(e));case 5:case"end":return t.stop()}}),t,this)})));function e(){return t.apply(this,arguments)}return e}()},{key:"created",value:function(){var t=P(l.a.mark((function t(){var e,n;return l.a.wrap((function(t){while(1)switch(t.prev=t.next){case 0:if(e=this.$route.params.token,v["a"].checkAddressChecksum(e)){t.next=4;break}return this.navigateToHome(),t.abrupt("return");case 4:return t.next=6,this.$raiden.fetchTokenData([e]);case 6:return"number"!==typeof this.token.decimals&&this.navigateToHome(),t.next=9,this.$raiden.monitorToken(e);case 9:this.isConnectedToHub||"goerli"!==this.network.name||(this.partner=null!==(n="hub.raiden.eth")&&void 0!==n?n:"");case 10:case"end":return t.stop()}}),t,this)})));function e(){return t.apply(this,arguments)}return e}()},{key:"mintDone",value:function(){var t=P(l.a.mark((function t(){return l.a.wrap((function(t){while(1)switch(t.prev=t.next){case 0:return this.showUdcDeposit=!1,t.next=3,this.updateUDCCapacity();case 3:case"end":return t.stop()}}),t,this)})));function e(){return t.apply(this,arguments)}return e}()},{key:"token",get:function(){var t=this.$route.params.token;return this.getToken(t)||{address:t}}},{key:"isConnectedToHub",get:function(){var t=this.$route.params.token;return!p()(this.channels[t])}},{key:"serviceToken",get:function(){var t;return null!==(t=this.udcToken.symbol)&&void 0!==t?t:this.mainnet?"RDN":"SVT"}}]),n}(Object(i["c"])(m["a"]));F=Object(c["b"])([Object(i["a"])({components:{TokenInformation:w["a"],Divider:g["a"],AddressInput:y["a"],ActionButton:O["a"],UdcDepositDialog:k["a"],AmountDisplay:h["a"]},computed:x(x({},Object(d["d"])(["defaultAccount","channels","network"])),Object(d["c"])({getToken:"token",mainnet:"mainnet",udcToken:"udcToken"}))})],F);var I=F,q=I,z=(n("4f0f"),n("2877")),J=n("6544"),N=n.n(J),L=n("8336"),M=n("62ad"),Z=n("4bd4"),G=n("132d"),K=n("0fd9"),Q=n("8654"),W=n("3a2f"),X=Object(z["a"])(q,a,u,!1,null,"094929c1",null),Y=X.exports;N()(X,{VBtn:L["a"],VCol:M["a"],VForm:Z["a"],VIcon:G["a"],VRow:K["a"],VTextField:Q["a"],VTooltip:W["a"]});var tt=n("f931");function et(t){return et="function"===typeof Symbol&&"symbol"===typeof Symbol.iterator?function(t){return typeof t}:function(t){return t&&"function"===typeof Symbol&&t.constructor===Symbol&&t!==Symbol.prototype?"symbol":typeof t},et(t)}function nt(t,e){if(!(t instanceof e))throw new TypeError("Cannot call a class as a function")}function rt(t,e){if("function"!==typeof e&&null!==e)throw new TypeError("Super expression must either be null or a function");t.prototype=Object.create(e&&e.prototype,{constructor:{value:t,writable:!0,configurable:!0}}),e&&ot(t,e)}function ot(t,e){return ot=Object.setPrototypeOf||function(t,e){return t.__proto__=e,t},ot(t,e)}function ct(t){var e=ut();return function(){var n,r=st(t);if(e){var o=st(this).constructor;n=Reflect.construct(r,arguments,o)}else n=r.apply(this,arguments);return it(this,n)}}function it(t,e){return!e||"object"!==et(e)&&"function"!==typeof e?at(t):e}function at(t){if(void 0===t)throw new ReferenceError("this hasn't been initialised - super() hasn't been called");return t}function ut(){if("undefined"===typeof Reflect||!Reflect.construct)return!1;if(Reflect.construct.sham)return!1;if("function"===typeof Proxy)return!0;try{return Date.prototype.toString.call(Reflect.construct(Date,[],(function(){}))),!0}catch(t){return!1}}function st(t){return st=Object.setPrototypeOf?Object.getPrototypeOf:function(t){return t.__proto__||Object.getPrototypeOf(t)},st(t)}var lt=function(t){rt(n,t);var e=ct(n);function n(){return nt(this,n),e.apply(this,arguments)}return n}(i["e"]);lt=Object(c["b"])([Object(i["a"])({components:{LazyRoute:tt["a"],SelectHub:Y}})],lt);var ft=lt,pt=ft,dt=Object(z["a"])(pt,r,o,!1,null,"f6ffb832",null);e["default"]=dt.exports},7688:function(t,e,n){"use strict";var r=function(){var t=this,e=t.$createElement,n=t._self._c||e;return n("raiden-dialog",{attrs:{visible:t.visible},on:{close:t.cancel}},[t.error?t._e():n("v-card-title",[t._v(" "+t._s(t.$t(t.mainnet?"udc-deposit-dialog.button-main":"udc-deposit-dialog.button"))+" ")]),n("v-card-text",[t.loading||t.error?t.error?n("v-row",[n("error-message",{attrs:{error:t.error}})],1):n("v-row",{staticClass:"udc-deposit-dialog--progress"},[n("v-col",{attrs:{cols:"12"}},[n("v-row",[n("spinner")],1),n("v-row",{attrs:{"no-gutters":"",align:"center",justify:"center"}},["mint"===t.step?n("span",[t._v(" "+t._s(t.$t("udc-deposit-dialog.progress.mint",{currency:t.serviceToken}))+" ")]):"approve"===t.step?n("span",[t._v(" "+t._s(t.$t("udc-deposit-dialog.progress.approve",{currency:t.serviceToken}))+" ")]):"deposit"===t.step?n("span",[t._v(" "+t._s(t.$t("udc-deposit-dialog.progress.deposit",{currency:t.serviceToken}))+" ")]):t._e()])],1)],1):n("v-row",{attrs:{justify:"center","no-gutters":""}},[n("v-col",{attrs:{cols:"6"}},[n("v-text-field",{staticClass:"udc-deposit-dialog__amount",attrs:{autofocus:"",type:"text",suffix:t.serviceToken},model:{value:t.amount,callback:function(e){t.amount=e},expression:"amount"}})],1)],1),t.loading||t.error?t._e():n("v-row",{staticClass:"udc-deposit-dialog__available"},[t._v(" "+t._s(t.$t("udc-deposit-dialog.available",{balance:t.accountBalance,currency:t.$t("app-header.currency")}))+" ")])],1),t.error?t._e():n("v-card-actions",[n("action-button",{staticClass:"udc-deposit-dialog__action",attrs:{arrow:"","full-width":"",enabled:t.valid&&!t.loading,text:t.$t(t.mainnet?"udc-deposit-dialog.button-main":"udc-deposit-dialog.button")},on:{click:function(e){return t.udcDeposit()}}})],1)],1)},o=[],c=n("4795"),i=n.n(c),a=n("9ab4"),u=n("60a3"),s=n("2f62"),l=n("750b"),f=n("a3d5"),p=n("66bc"),d=n("8e27"),b=n("0527");function y(t){return y="function"===typeof Symbol&&"symbol"===typeof Symbol.iterator?function(t){return typeof t}:function(t){return t&&"function"===typeof Symbol&&t.constructor===Symbol&&t!==Symbol.prototype?"symbol":typeof t},y(t)}function v(t,e){var n=Object.keys(t);if(Object.getOwnPropertySymbols){var r=Object.getOwnPropertySymbols(t);e&&(r=r.filter((function(e){return Object.getOwnPropertyDescriptor(t,e).enumerable}))),n.push.apply(n,r)}return n}function h(t){for(var e=1;e<arguments.length;e++){var n=null!=arguments[e]?arguments[e]:{};e%2?v(Object(n),!0).forEach((function(e){m(t,e,n[e])})):Object.getOwnPropertyDescriptors?Object.defineProperties(t,Object.getOwnPropertyDescriptors(n)):v(Object(n)).forEach((function(e){Object.defineProperty(t,e,Object.getOwnPropertyDescriptor(n,e))}))}return t}function m(t,e,n){return e in t?Object.defineProperty(t,e,{value:n,enumerable:!0,configurable:!0,writable:!0}):t[e]=n,t}function g(t,e,n,r,o,c,i){try{var a=t[c](i),u=a.value}catch(s){return void n(s)}a.done?e(u):Promise.resolve(u).then(r,o)}function w(t){return function(){var e=this,n=arguments;return new Promise((function(r,o){var c=t.apply(e,n);function i(t){g(c,r,o,i,a,"next",t)}function a(t){g(c,r,o,i,a,"throw",t)}i(void 0)}))}}function O(t,e){if(!(t instanceof e))throw new TypeError("Cannot call a class as a function")}function k(t,e){for(var n=0;n<e.length;n++){var r=e[n];r.enumerable=r.enumerable||!1,r.configurable=!0,"value"in r&&(r.writable=!0),Object.defineProperty(t,r.key,r)}}function _(t,e,n){return e&&k(t.prototype,e),n&&k(t,n),t}function j(t,e){if("function"!==typeof e&&null!==e)throw new TypeError("Super expression must either be null or a function");t.prototype=Object.create(e&&e.prototype,{constructor:{value:t,writable:!0,configurable:!0}}),e&&x(t,e)}function x(t,e){return x=Object.setPrototypeOf||function(t,e){return t.__proto__=e,t},x(t,e)}function T(t){var e=D();return function(){var n,r=S(t);if(e){var o=S(this).constructor;n=Reflect.construct(r,arguments,o)}else n=r.apply(this,arguments);return C(this,n)}}function C(t,e){return!e||"object"!==y(e)&&"function"!==typeof e?P(t):e}function P(t){if(void 0===t)throw new ReferenceError("this hasn't been initialised - super() hasn't been called");return t}function D(){if("undefined"===typeof Reflect||!Reflect.construct)return!1;if(Reflect.construct.sham)return!1;if("function"===typeof Proxy)return!0;try{return Date.prototype.toString.call(Reflect.construct(Date,[],(function(){}))),!0}catch(t){return!1}}function S(t){return S=Object.setPrototypeOf?Object.getPrototypeOf:function(t){return t.__proto__||Object.getPrototypeOf(t)},S(t)}var R=function(t){j(n,t);var e=T(n);function n(){var t;return O(this,n),t=e.apply(this,arguments),t.amount="10",t.loading=!1,t.error=null,t.step="",t}return _(n,[{key:"cancel",value:function(){this.error=null}},{key:"udcDeposit",value:function(){var t=w(i.a.mark((function t(){var e,n,r=this;return i.a.wrap((function(t){while(1)switch(t.prev=t.next){case 0:if(this.error=null,this.loading=!0,e=this.udcToken,n=f["a"].parse(this.amount,e.decimals),t.prev=4,this.mainnet||!n.gt(e.balance)){t.next=9;break}return this.step="mint",t.next=9,this.$raiden.mint(e.address,n);case 9:return this.step="approve",t.next=12,this.$raiden.depositToUDC(n,(function(){r.step="deposit"}));case 12:this.$emit("done"),t.next=18;break;case 15:t.prev=15,t.t0=t["catch"](4),this.error=t.t0;case 18:this.step="",this.loading=!1;case 20:case"end":return t.stop()}}),t,this,[[4,15]])})));function e(){return t.apply(this,arguments)}return e}()},{key:"serviceToken",get:function(){var t;return null!==(t=this.udcToken.symbol)&&void 0!==t?t:this.mainnet?"RDN":"SVT"}},{key:"valid",get:function(){return/^[1-9]\d*$/.test(this.amount)}}]),n}(u["e"]);Object(a["b"])([Object(u["d"])({required:!0,type:Boolean})],R.prototype,"visible",void 0),Object(a["b"])([Object(u["b"])()],R.prototype,"cancel",null),R=Object(a["b"])([Object(u["a"])({components:{ActionButton:l["a"],RaidenDialog:p["a"],ErrorMessage:d["a"],Spinner:b["a"]},computed:h(h({},Object(s["d"])(["accountBalance"])),Object(s["c"])(["mainnet","udcToken"]))})],R);var $=R,E=$,V=(n("d909"),n("2877")),U=n("6544"),A=n.n(U),H=n("99d9"),B=n("62ad"),F=n("0fd9"),I=n("8654"),q=Object(V["a"])(E,r,o,!1,null,"7ccc2d47",null);e["a"]=q.exports;A()(q,{VCardActions:H["a"],VCardText:H["b"],VCardTitle:H["c"],VCol:B["a"],VRow:F["a"],VTextField:I["a"]})},d909:function(t,e,n){"use strict";var r=n("e19d"),o=n.n(r);o.a},e19d:function(t,e,n){},eae7:function(t,e,n){}}]);