(window["webpackJsonp"]=window["webpackJsonp"]||[]).push([["chunk-1e15440c"],{"03af":function(t,e,r){"use strict";var n=function(){var t=this,e=t.$createElement,r=t._self._c||e;return r("div",{class:{"amount-display--inline":t.inline},on:{mouseover:function(e){t.exactAmount&&(t.displayExactAmount=!0)},mouseleave:function(e){t.exactAmount&&(t.displayExactAmount=!1)}}},[t.displayExactAmount?r("span",[t._v(" "+t._s(t._f("toUnits")(t.amount,t.token.decimals))+" "+t._s(t.token.symbol||"")+" ")]):r("span",[t._v(" "+t._s(t._f("displayFormat")(t.amount,t.token.decimals))+" "+t._s(t.token.symbol||"")+" ")])])},o=[],c=r("4a7b"),a=r("9eb3");function i(t){return i="function"===typeof Symbol&&"symbol"===typeof Symbol.iterator?function(t){return typeof t}:function(t){return t&&"function"===typeof Symbol&&t.constructor===Symbol&&t!==Symbol.prototype?"symbol":typeof t},i(t)}function s(t,e){if(!(t instanceof e))throw new TypeError("Cannot call a class as a function")}function u(t,e){if("function"!==typeof e&&null!==e)throw new TypeError("Super expression must either be null or a function");t.prototype=Object.create(e&&e.prototype,{constructor:{value:t,writable:!0,configurable:!0}}),e&&l(t,e)}function l(t,e){return l=Object.setPrototypeOf||function(t,e){return t.__proto__=e,t},l(t,e)}function f(t){var e=y();return function(){var r,n=v(t);if(e){var o=v(this).constructor;r=Reflect.construct(n,arguments,o)}else r=n.apply(this,arguments);return p(this,r)}}function p(t,e){return!e||"object"!==i(e)&&"function"!==typeof e?d(t):e}function d(t){if(void 0===t)throw new ReferenceError("this hasn't been initialised - super() hasn't been called");return t}function y(){if("undefined"===typeof Reflect||!Reflect.construct)return!1;if(Reflect.construct.sham)return!1;if("function"===typeof Proxy)return!0;try{return Date.prototype.toString.call(Reflect.construct(Date,[],(function(){}))),!0}catch(t){return!1}}function v(t){return v=Object.setPrototypeOf?Object.getPrototypeOf:function(t){return t.__proto__||Object.getPrototypeOf(t)},v(t)}var b=function(t){u(r,t);var e=f(r);function r(){var t;return s(this,r),t=e.apply(this,arguments),t.displayExactAmount=!1,t}return r}(a["e"]);Object(c["a"])([Object(a["d"])({required:!1,default:!1,type:Boolean})],b.prototype,"exactAmount",void 0),Object(c["a"])([Object(a["d"])({required:!0})],b.prototype,"amount",void 0),Object(c["a"])([Object(a["d"])({required:!0})],b.prototype,"token",void 0),Object(c["a"])([Object(a["d"])({required:!1,default:!1,type:Boolean})],b.prototype,"inline",void 0),b=Object(c["a"])([Object(a["a"])({})],b);var h=b,m=h,w=(r("e83f"),r("8e3c")),g=Object(w["a"])(m,n,o,!1,null,"b1b477aa",null);e["a"]=g.exports},"1c2c":function(t,e,r){"use strict";var n=r("a7f7"),o=r.n(n);o.a},"43a4":function(t,e,r){"use strict";var n=r("a248"),o=r.n(n);o.a},"4c07":function(t,e,r){"use strict";r.r(e);var n=function(){var t=this,e=t.$createElement,n=t._self._c||e;return n("div",[n("v-row",{staticClass:"udc__description",attrs:{justify:"center","no-gutters":""}},[n("p",[t._v(" "+t._s(t.$t("udc.description"))+" ")])]),n("v-row",{attrs:{justify:"center"}},[n("v-col",{attrs:{cols:"10"}},[n("h3",{staticClass:"udc__sub-head"},[t._v(" "+t._s(t.$t(t.mainnet?"udc.deposit":"udc.mint-deposit"))+" ")])])],1),t.loading||t.error?t.error?n("v-row",{attrs:{justify:"center"}},[n("v-col",{attrs:{cols:"10"}},[n("error-message",{attrs:{error:t.error}})],1)],1):n("v-row",{staticClass:"udc__progress",attrs:{justify:"center"}},[n("v-col",{attrs:{cols:"10"}},[n("v-row",[n("spinner")],1),n("v-row",{attrs:{"no-gutters":"",align:"center",justify:"center"}},["mint"===t.step?n("span",[t._v(" "+t._s(t.$t("udc-deposit-dialog.progress.mint",{currency:t.serviceToken}))+" ")]):"approve"===t.step?n("span",[t._v(" "+t._s(t.$t("udc-deposit-dialog.progress.approve",{currency:t.serviceToken}))+" ")]):"deposit"===t.step?n("span",[t._v(" "+t._s(t.$t("udc-deposit-dialog.progress.deposit",{currency:t.serviceToken}))+" ")]):t._e()])],1)],1):n("v-row",{attrs:{justify:"center","no-gutters":""}},[n("v-col",{attrs:{cols:"6"}},[n("v-text-field",{staticClass:"udc__mint-deposit--amount",attrs:{autofocus:"",type:"text",suffix:t.serviceToken},model:{value:t.amount,callback:function(e){t.amount=e},expression:"amount"}})],1)],1),t.loading||t.error?t._e():n("v-row",{attrs:{justify:"center"}},[n("v-col",{staticClass:"text-center",attrs:{cols:"10"}},[n("p",[t._v(" "+t._s(t.$t("udc-deposit-dialog.available",{balance:t.accountBalance,currency:t.$t("app-header.currency")}))+" ")])])],1),t.loading||t.error?t._e():n("v-row",{attrs:{justify:"center"}},[n("action-button",{staticClass:"udc__action",attrs:{arrow:"",enabled:t.valid&&!t.loading,text:t.$t(t.mainnet?"udc-deposit-dialog.button-main":"udc-deposit-dialog.button")},on:{click:function(e){return t.udcDeposit()}}})],1),n("v-row",{attrs:{justify:"center"}},[n("v-col",{attrs:{cols:"10"}},[n("hr")])],1),n("v-row",{attrs:{justify:"center"}},[n("v-col",{attrs:{cols:"10"}},[n("p",{class:{"udc__low-balance":!t.hasEnoughServiceTokens}},[t._v(" "+t._s(t.$t("udc.balance"))+" "),n("amount-display",{attrs:{inline:"",amount:t.udcCapacity,token:t.udcToken}}),t.hasEnoughServiceTokens?n("v-btn",{staticClass:"udc__withdrawal-button",attrs:{height:"20px",width:"22px",icon:""},on:{click:function(e){t.withdrawFromUdc=!0}}},[n("v-img",{attrs:{height:"20px",width:"20px",src:r("45f0")}})],1):t._e()],1),t.hasEnoughServiceTokens?t._e():n("p",{class:{"udc__low-balance":!t.hasEnoughServiceTokens}},[t._v(" "+t._s(t.$t("udc.balance-too-low",{symbol:t.serviceToken}))+" ")])])],1),n("udc-withdrawal-dialog",{attrs:{visible:t.withdrawFromUdc,"account-balance":t.accountBalance,token:t.udcToken,capacity:t.udcCapacity},on:{cancel:function(e){t.withdrawFromUdc=!1}}})],1)},o=[],c=r("f633"),a=r.n(c),i=r("4a7b"),s=r("9eb3"),u=r("7aa1"),l=r("f30a"),f=r("a3d5"),p=r("750b"),d=r("03af"),y=r("8e27"),v=r("7688"),b=function(){var t=this,e=t.$createElement,n=t._self._c||e;return n("raiden-dialog",{attrs:{visible:t.visible},on:{close:t.cancel}},[n("v-card-title",[t._v(t._s(t.$t("udc.withdrawal")))]),n("v-card-text",[n("v-row",{attrs:{align:"center",justify:"center","no-gutters":""}},[t.error?n("v-col",[n("v-row",[n("error-message",{attrs:{error:t.error}})],1)],1):t.isDone?n("v-col",{attrs:{cols:"12"}},[n("v-row",{attrs:{align:"center",justify:"center"}},[n("v-col",{attrs:{cols:"6"}},[n("v-img",{staticClass:"udc-withdrawal-dialog__done",attrs:{src:r("2e1f")}})],1)],1),n("v-row",{attrs:{align:"center",justify:"center"}},[n("v-col",{attrs:{cols:"10"}},[t._v(" "+t._s(t.$t("udc.withdrawal-planned")))])],1)],1):t.inProgress?n("v-col",[n("spinner",{staticClass:"udc-withdrawal-dialog__progress"})],1):n("v-col",{attrs:{cols:"12"}},[n("v-row",{attrs:{"no-gutters":"",justify:"center"}},[n("v-col",{attrs:{cols:"6"}},[n("v-text-field",{staticClass:"udc-withdrawal-dialog__amount",attrs:{autofocus:"",type:"text",suffix:t.token.symbol},model:{value:t.amount,callback:function(e){t.amount=e},expression:"amount"}})],1),n("v-col",{staticClass:"udc-withdrawal-dialog__asterisk",attrs:{cols:"1"}},[n("sup",[t._v(" "+t._s(t.$t("udc.asterisk"))+" ")])])],1),n("v-row",{staticClass:"udc-withdrawal-dialog__available",attrs:{"no-gutters":""}},[t._v(" "+t._s(t.$t("udc-deposit-dialog.available",{balance:t.accountBalance,currency:t.$t("app-header.currency")}))+" ")])],1)],1)],1),t.error||t.isDone?t._e():n("v-card-actions",[n("action-button",{attrs:{enabled:t.isValid,text:t.$t("general.buttons.confirm")},on:{click:t.planWithdraw}})],1),t.error?t._e():n("v-card-text",[n("v-row",{staticClass:"udc-withdrawal-dialog__footnote",attrs:{"no-gutters":""}},[n("span",[n("sup",[t._v(t._s(t.$t("udc.asterisk")))]),t._v(" "+t._s(t.$t("udc.withdrawal-footnote"))+" ")])])],1)],1)},h=[],m=r("66bc"),w=r("38dd"),g=r("0527");function O(t){return O="function"===typeof Symbol&&"symbol"===typeof Symbol.iterator?function(t){return typeof t}:function(t){return t&&"function"===typeof Symbol&&t.constructor===Symbol&&t!==Symbol.prototype?"symbol":typeof t},O(t)}function _(t,e){var r=Object.keys(t);if(Object.getOwnPropertySymbols){var n=Object.getOwnPropertySymbols(t);e&&(n=n.filter((function(e){return Object.getOwnPropertyDescriptor(t,e).enumerable}))),r.push.apply(r,n)}return r}function j(t){for(var e=1;e<arguments.length;e++){var r=null!=arguments[e]?arguments[e]:{};e%2?_(Object(r),!0).forEach((function(e){k(t,e,r[e])})):Object.getOwnPropertyDescriptors?Object.defineProperties(t,Object.getOwnPropertyDescriptors(r)):_(Object(r)).forEach((function(e){Object.defineProperty(t,e,Object.getOwnPropertyDescriptor(r,e))}))}return t}function k(t,e,r){return e in t?Object.defineProperty(t,e,{value:r,enumerable:!0,configurable:!0,writable:!0}):t[e]=r,t}function x(t,e,r,n,o,c,a){try{var i=t[c](a),s=i.value}catch(u){return void r(u)}i.done?e(s):Promise.resolve(s).then(n,o)}function P(t){return function(){var e=this,r=arguments;return new Promise((function(n,o){var c=t.apply(e,r);function a(t){x(c,n,o,a,i,"next",t)}function i(t){x(c,n,o,a,i,"throw",t)}a(void 0)}))}}function S(t,e){if(!(t instanceof e))throw new TypeError("Cannot call a class as a function")}function T(t,e){for(var r=0;r<e.length;r++){var n=e[r];n.enumerable=n.enumerable||!1,n.configurable=!0,"value"in n&&(n.writable=!0),Object.defineProperty(t,n.key,n)}}function C(t,e,r){return e&&T(t.prototype,e),r&&T(t,r),t}function D(t,e){if("function"!==typeof e&&null!==e)throw new TypeError("Super expression must either be null or a function");t.prototype=Object.create(e&&e.prototype,{constructor:{value:t,writable:!0,configurable:!0}}),e&&$(t,e)}function $(t,e){return $=Object.setPrototypeOf||function(t,e){return t.__proto__=e,t},$(t,e)}function E(t){var e=A();return function(){var r,n=B(t);if(e){var o=B(this).constructor;r=Reflect.construct(n,arguments,o)}else r=n.apply(this,arguments);return R(this,r)}}function R(t,e){return!e||"object"!==O(e)&&"function"!==typeof e?V(t):e}function V(t){if(void 0===t)throw new ReferenceError("this hasn't been initialised - super() hasn't been called");return t}function A(){if("undefined"===typeof Reflect||!Reflect.construct)return!1;if(Reflect.construct.sham)return!1;if("function"===typeof Proxy)return!0;try{return Date.prototype.toString.call(Reflect.construct(Date,[],(function(){}))),!0}catch(t){return!1}}function B(t){return B=Object.setPrototypeOf?Object.getPrototypeOf:function(t){return t.__proto__||Object.getPrototypeOf(t)},B(t)}var U=function(t){D(r,t);var e=E(r);function r(){var t;return S(this,r),t=e.apply(this,arguments),t.amount="0",t.inProgress=!1,t.error=null,t.isDone=!1,t}return C(r,[{key:"done",value:function(){var t=this;this.isDone=!0,setTimeout((function(){t.isDone=!1,t.cancel()}),5e3)}},{key:"planWithdraw",value:function(){var t=P(a.a.mark((function t(){return a.a.wrap((function(t){while(1)switch(t.prev=t.next){case 0:return this.inProgress=!0,t.prev=1,t.next=4,this.$raiden.planUdcWithdraw(this.withdrawAmount);case 4:this.done(),t.next=10;break;case 7:t.prev=7,t.t0=t["catch"](1),this.error=t.t0;case 10:return t.prev=10,this.inProgress=!1,t.finish(10);case 13:case"end":return t.stop()}}),t,this,[[1,7,10,13]])})));function e(){return t.apply(this,arguments)}return e}()},{key:"cancel",value:function(){this.isDone=!1,this.inProgress=!1,this.error="",this.amount="0"}},{key:"withdrawAmount",get:function(){var t;try{t=Object(w["parseUnits"])(this.amount,this.token.decimals)}catch(e){t=l["Zero"]}return t}},{key:"isValid",get:function(){if(this.inProgress)return!1;var t=this.withdrawAmount;return t.gt(l["Zero"])&&t.lte(this.capacity)}}]),r}(s["e"]);Object(i["a"])([Object(s["d"])({required:!0,type:Boolean})],U.prototype,"visible",void 0),Object(i["a"])([Object(s["d"])({required:!0,type:String})],U.prototype,"accountBalance",void 0),Object(i["a"])([Object(s["d"])({required:!0})],U.prototype,"token",void 0),Object(i["a"])([Object(s["d"])({required:!0})],U.prototype,"capacity",void 0),Object(i["a"])([Object(s["b"])()],U.prototype,"cancel",null),U=Object(i["a"])([Object(s["a"])({components:{ErrorMessage:y["a"],RaidenDialog:m["a"],ActionButton:p["a"],Spinner:g["a"]},computed:j({},Object(u["d"])(["udcToken"]))})],U);var q=U,F=q,W=(r("5e55"),r("8e3c")),M=r("8f3c"),Z=r.n(M),I=r("61c1"),J=r("0fbe"),N=r("f097"),z=r("897f"),G=r("12c1"),H=Object(W["a"])(F,b,h,!1,null,"dca38e86",null),K=H.exports;function L(t){return L="function"===typeof Symbol&&"symbol"===typeof Symbol.iterator?function(t){return typeof t}:function(t){return t&&"function"===typeof Symbol&&t.constructor===Symbol&&t!==Symbol.prototype?"symbol":typeof t},L(t)}function Q(t,e){var r=Object.keys(t);if(Object.getOwnPropertySymbols){var n=Object.getOwnPropertySymbols(t);e&&(n=n.filter((function(e){return Object.getOwnPropertyDescriptor(t,e).enumerable}))),r.push.apply(r,n)}return r}function X(t){for(var e=1;e<arguments.length;e++){var r=null!=arguments[e]?arguments[e]:{};e%2?Q(Object(r),!0).forEach((function(e){Y(t,e,r[e])})):Object.getOwnPropertyDescriptors?Object.defineProperties(t,Object.getOwnPropertyDescriptors(r)):Q(Object(r)).forEach((function(e){Object.defineProperty(t,e,Object.getOwnPropertyDescriptor(r,e))}))}return t}function Y(t,e,r){return e in t?Object.defineProperty(t,e,{value:r,enumerable:!0,configurable:!0,writable:!0}):t[e]=r,t}function tt(t,e,r,n,o,c,a){try{var i=t[c](a),s=i.value}catch(u){return void r(u)}i.done?e(s):Promise.resolve(s).then(n,o)}function et(t){return function(){var e=this,r=arguments;return new Promise((function(n,o){var c=t.apply(e,r);function a(t){tt(c,n,o,a,i,"next",t)}function i(t){tt(c,n,o,a,i,"throw",t)}a(void 0)}))}}function rt(t,e){if(!(t instanceof e))throw new TypeError("Cannot call a class as a function")}function nt(t,e){for(var r=0;r<e.length;r++){var n=e[r];n.enumerable=n.enumerable||!1,n.configurable=!0,"value"in n&&(n.writable=!0),Object.defineProperty(t,n.key,n)}}function ot(t,e,r){return e&&nt(t.prototype,e),r&&nt(t,r),t}function ct(t,e){if("function"!==typeof e&&null!==e)throw new TypeError("Super expression must either be null or a function");t.prototype=Object.create(e&&e.prototype,{constructor:{value:t,writable:!0,configurable:!0}}),e&&at(t,e)}function at(t,e){return at=Object.setPrototypeOf||function(t,e){return t.__proto__=e,t},at(t,e)}function it(t){var e=lt();return function(){var r,n=ft(t);if(e){var o=ft(this).constructor;r=Reflect.construct(n,arguments,o)}else r=n.apply(this,arguments);return st(this,r)}}function st(t,e){return!e||"object"!==L(e)&&"function"!==typeof e?ut(t):e}function ut(t){if(void 0===t)throw new ReferenceError("this hasn't been initialised - super() hasn't been called");return t}function lt(){if("undefined"===typeof Reflect||!Reflect.construct)return!1;if(Reflect.construct.sham)return!1;if("function"===typeof Proxy)return!0;try{return Date.prototype.toString.call(Reflect.construct(Date,[],(function(){}))),!0}catch(t){return!1}}function ft(t){return ft=Object.setPrototypeOf?Object.getPrototypeOf:function(t){return t.__proto__||Object.getPrototypeOf(t)},ft(t)}Z()(H,{VCardActions:I["a"],VCardText:I["b"],VCardTitle:I["c"],VCol:J["a"],VImg:N["a"],VRow:z["a"],VTextField:G["a"]});var pt=function(t){ct(r,t);var e=it(r);function r(){var t;return rt(this,r),t=e.apply(this,arguments),t.amount="10",t.loading=!1,t.error=null,t.step="",t.udcCapacity=l["Zero"],t.hasEnoughServiceTokens=!1,t.withdrawFromUdc=!1,t}return ot(r,[{key:"mounted",value:function(){var t=et(a.a.mark((function t(){return a.a.wrap((function(t){while(1)switch(t.prev=t.next){case 0:return t.next=2,this.updateUDCCapacity();case 2:case"end":return t.stop()}}),t,this)})));function e(){return t.apply(this,arguments)}return e}()},{key:"udcDeposit",value:function(){var t=et(a.a.mark((function t(){var e,r,n=this;return a.a.wrap((function(t){while(1)switch(t.prev=t.next){case 0:if(this.error=null,this.loading=!0,e=this.udcToken,r=f["a"].parse(this.amount,e.decimals),t.prev=4,this.mainnet||!r.gt(e.balance)){t.next=9;break}return this.step="mint",t.next=9,this.$raiden.mint(e.address,r);case 9:return this.step="approve",t.next=12,this.$raiden.depositToUDC(r,(function(){n.step="deposit"}));case 12:return t.next=14,this.updateUDCCapacity();case 14:this.$emit("done"),t.next=20;break;case 17:t.prev=17,t.t0=t["catch"](4),this.error=t.t0;case 20:this.step="",this.loading=!1;case 22:case"end":return t.stop()}}),t,this,[[4,17]])})));function e(){return t.apply(this,arguments)}return e}()},{key:"updateUDCCapacity",value:function(){var t=et(a.a.mark((function t(){var e;return a.a.wrap((function(t){while(1)switch(t.prev=t.next){case 0:return e=this.$raiden.monitoringReward,t.next=3,this.$raiden.getUDCCapacity();case 3:this.udcCapacity=t.sent,this.hasEnoughServiceTokens=!(!e||!this.udcCapacity.gte(e));case 5:case"end":return t.stop()}}),t,this)})));function e(){return t.apply(this,arguments)}return e}()},{key:"serviceToken",get:function(){var t;return null!==(t=this.udcToken.symbol)&&void 0!==t?t:this.mainnet?"RDN":"SVT"}},{key:"valid",get:function(){return/^[1-9]\d*$/.test(this.amount)}}]),r}(s["e"]);pt=Object(i["a"])([Object(s["a"])({components:{ActionButton:p["a"],UdcDepositDialog:v["a"],UdcWithdrawalDialog:K,AmountDisplay:d["a"],ErrorMessage:y["a"],Spinner:g["a"]},computed:X(X({},Object(u["f"])(["accountBalance"])),Object(u["d"])(["mainnet","udcToken"]))})],pt);var dt=pt,yt=dt,vt=(r("1c2c"),r("34f2")),bt=Object(W["a"])(yt,n,o,!1,null,"6d09b294",null);e["default"]=bt.exports;Z()(bt,{VBtn:vt["a"],VCol:J["a"],VImg:N["a"],VRow:z["a"],VTextField:G["a"]})},"5e55":function(t,e,r){"use strict";var n=r("d3bc"),o=r.n(n);o.a},6932:function(t,e,r){},7688:function(t,e,r){"use strict";var n=function(){var t=this,e=t.$createElement,r=t._self._c||e;return r("raiden-dialog",{attrs:{visible:t.visible},on:{close:t.cancel}},[t.error?t._e():r("v-card-title",[t._v(" "+t._s(t.$t(t.mainnet?"udc-deposit-dialog.button-main":"udc-deposit-dialog.button"))+" ")]),r("v-card-text",[t.loading||t.error?t.error?r("v-row",[r("error-message",{attrs:{error:t.error}})],1):r("v-row",{staticClass:"udc-deposit-dialog--progress"},[r("v-col",{attrs:{cols:"12"}},[r("v-row",[r("spinner")],1),r("v-row",{attrs:{"no-gutters":"",align:"center",justify:"center"}},["mint"===t.step?r("span",[t._v(" "+t._s(t.$t("udc-deposit-dialog.progress.mint",{currency:t.serviceToken}))+" ")]):"approve"===t.step?r("span",[t._v(" "+t._s(t.$t("udc-deposit-dialog.progress.approve",{currency:t.serviceToken}))+" ")]):"deposit"===t.step?r("span",[t._v(" "+t._s(t.$t("udc-deposit-dialog.progress.deposit",{currency:t.serviceToken}))+" ")]):t._e()])],1)],1):r("v-row",{attrs:{justify:"center","no-gutters":""}},[r("v-col",{attrs:{cols:"6"}},[r("v-text-field",{staticClass:"udc-deposit-dialog__amount",attrs:{autofocus:"",type:"text",suffix:t.serviceToken},model:{value:t.amount,callback:function(e){t.amount=e},expression:"amount"}})],1)],1),t.loading||t.error?t._e():r("v-row",{staticClass:"udc-deposit-dialog__available"},[t._v(" "+t._s(t.$t("udc-deposit-dialog.available",{balance:t.accountBalance,currency:t.$t("app-header.currency")}))+" ")])],1),t.error?t._e():r("v-card-actions",[r("action-button",{staticClass:"udc-deposit-dialog__action",attrs:{arrow:"","full-width":"",enabled:t.valid&&!t.loading,text:t.$t(t.mainnet?"udc-deposit-dialog.button-main":"udc-deposit-dialog.button")},on:{click:function(e){return t.udcDeposit()}}})],1)],1)},o=[],c=r("f633"),a=r.n(c),i=r("4a7b"),s=r("9eb3"),u=r("7aa1"),l=r("750b"),f=r("a3d5"),p=r("66bc"),d=r("8e27"),y=r("0527");function v(t){return v="function"===typeof Symbol&&"symbol"===typeof Symbol.iterator?function(t){return typeof t}:function(t){return t&&"function"===typeof Symbol&&t.constructor===Symbol&&t!==Symbol.prototype?"symbol":typeof t},v(t)}function b(t,e){var r=Object.keys(t);if(Object.getOwnPropertySymbols){var n=Object.getOwnPropertySymbols(t);e&&(n=n.filter((function(e){return Object.getOwnPropertyDescriptor(t,e).enumerable}))),r.push.apply(r,n)}return r}function h(t){for(var e=1;e<arguments.length;e++){var r=null!=arguments[e]?arguments[e]:{};e%2?b(Object(r),!0).forEach((function(e){m(t,e,r[e])})):Object.getOwnPropertyDescriptors?Object.defineProperties(t,Object.getOwnPropertyDescriptors(r)):b(Object(r)).forEach((function(e){Object.defineProperty(t,e,Object.getOwnPropertyDescriptor(r,e))}))}return t}function m(t,e,r){return e in t?Object.defineProperty(t,e,{value:r,enumerable:!0,configurable:!0,writable:!0}):t[e]=r,t}function w(t,e,r,n,o,c,a){try{var i=t[c](a),s=i.value}catch(u){return void r(u)}i.done?e(s):Promise.resolve(s).then(n,o)}function g(t){return function(){var e=this,r=arguments;return new Promise((function(n,o){var c=t.apply(e,r);function a(t){w(c,n,o,a,i,"next",t)}function i(t){w(c,n,o,a,i,"throw",t)}a(void 0)}))}}function O(t,e){if(!(t instanceof e))throw new TypeError("Cannot call a class as a function")}function _(t,e){for(var r=0;r<e.length;r++){var n=e[r];n.enumerable=n.enumerable||!1,n.configurable=!0,"value"in n&&(n.writable=!0),Object.defineProperty(t,n.key,n)}}function j(t,e,r){return e&&_(t.prototype,e),r&&_(t,r),t}function k(t,e){if("function"!==typeof e&&null!==e)throw new TypeError("Super expression must either be null or a function");t.prototype=Object.create(e&&e.prototype,{constructor:{value:t,writable:!0,configurable:!0}}),e&&x(t,e)}function x(t,e){return x=Object.setPrototypeOf||function(t,e){return t.__proto__=e,t},x(t,e)}function P(t){var e=C();return function(){var r,n=D(t);if(e){var o=D(this).constructor;r=Reflect.construct(n,arguments,o)}else r=n.apply(this,arguments);return S(this,r)}}function S(t,e){return!e||"object"!==v(e)&&"function"!==typeof e?T(t):e}function T(t){if(void 0===t)throw new ReferenceError("this hasn't been initialised - super() hasn't been called");return t}function C(){if("undefined"===typeof Reflect||!Reflect.construct)return!1;if(Reflect.construct.sham)return!1;if("function"===typeof Proxy)return!0;try{return Date.prototype.toString.call(Reflect.construct(Date,[],(function(){}))),!0}catch(t){return!1}}function D(t){return D=Object.setPrototypeOf?Object.getPrototypeOf:function(t){return t.__proto__||Object.getPrototypeOf(t)},D(t)}var $=function(t){k(r,t);var e=P(r);function r(){var t;return O(this,r),t=e.apply(this,arguments),t.amount="10",t.loading=!1,t.error=null,t.step="",t}return j(r,[{key:"cancel",value:function(){this.error=null}},{key:"udcDeposit",value:function(){var t=g(a.a.mark((function t(){var e,r,n=this;return a.a.wrap((function(t){while(1)switch(t.prev=t.next){case 0:if(this.error=null,this.loading=!0,e=this.udcToken,r=f["a"].parse(this.amount,e.decimals),t.prev=4,this.mainnet||!r.gt(e.balance)){t.next=9;break}return this.step="mint",t.next=9,this.$raiden.mint(e.address,r);case 9:return this.step="approve",t.next=12,this.$raiden.depositToUDC(r,(function(){n.step="deposit"}));case 12:this.$emit("done"),t.next=18;break;case 15:t.prev=15,t.t0=t["catch"](4),this.error=t.t0;case 18:this.step="",this.loading=!1;case 20:case"end":return t.stop()}}),t,this,[[4,15]])})));function e(){return t.apply(this,arguments)}return e}()},{key:"serviceToken",get:function(){var t;return null!==(t=this.udcToken.symbol)&&void 0!==t?t:this.mainnet?"RDN":"SVT"}},{key:"valid",get:function(){return/^[1-9]\d*$/.test(this.amount)}}]),r}(s["e"]);Object(i["a"])([Object(s["d"])({required:!0,type:Boolean})],$.prototype,"visible",void 0),Object(i["a"])([Object(s["b"])()],$.prototype,"cancel",null),$=Object(i["a"])([Object(s["a"])({components:{ActionButton:l["a"],RaidenDialog:p["a"],ErrorMessage:d["a"],Spinner:y["a"]},computed:h(h({},Object(u["f"])(["accountBalance"])),Object(u["d"])(["mainnet","udcToken"]))})],$);var E=$,R=E,V=(r("43a4"),r("8e3c")),A=r("8f3c"),B=r.n(A),U=r("61c1"),q=r("0fbe"),F=r("897f"),W=r("12c1"),M=Object(V["a"])(R,n,o,!1,null,"d86ef216",null);e["a"]=M.exports;B()(M,{VCardActions:U["a"],VCardText:U["b"],VCardTitle:U["c"],VCol:q["a"],VRow:F["a"],VTextField:W["a"]})},a248:function(t,e,r){},a7f7:function(t,e,r){},d3bc:function(t,e,r){},e83f:function(t,e,r){"use strict";var n=r("6932"),o=r.n(n);o.a}}]);