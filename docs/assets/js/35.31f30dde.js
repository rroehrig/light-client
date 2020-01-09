(window.webpackJsonp=window.webpackJsonp||[]).push([[35],{235:function(t,a,e){"use strict";e.r(a);var s=e(0),n=Object(s.a)({},(function(){var t=this,a=t.$createElement,e=t._self._c||a;return e("ContentSlotsDistributor",{attrs:{"slot-key":t.$parent.slotKey}},[e("h1",{attrs:{id:"install-and-import-the-sdk"}},[e("a",{staticClass:"header-anchor",attrs:{href:"#install-and-import-the-sdk"}},[t._v("#")]),t._v(" Install and Import the SDK")]),t._v(" "),e("p",[t._v("You can install the Raiden SDK as a node module by running:")]),t._v(" "),e("div",{staticClass:"language-bash extra-class"},[e("pre",{pre:!0,attrs:{class:"language-bash"}},[e("code",[e("span",{pre:!0,attrs:{class:"token function"}},[t._v("npm")]),t._v(" "),e("span",{pre:!0,attrs:{class:"token function"}},[t._v("install")]),t._v(" raiden-ts\n")])])]),e("p",[t._v("After installing the SDK you can simply import Raiden to your JavaScript or TypeScript project.")]),t._v(" "),e("div",{staticClass:"language-typescript extra-class"},[e("pre",{pre:!0,attrs:{class:"language-typescript"}},[e("code",[e("span",{pre:!0,attrs:{class:"token keyword"}},[t._v("import")]),t._v(" "),e("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("{")]),t._v(" Raiden "),e("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("}")]),t._v(" "),e("span",{pre:!0,attrs:{class:"token keyword"}},[t._v("from")]),t._v(" "),e("span",{pre:!0,attrs:{class:"token string"}},[t._v("'raiden-ts'")]),e("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(";")]),t._v("\n\n"),e("span",{pre:!0,attrs:{class:"token comment"}},[t._v("// async factory")]),t._v("\n"),e("span",{pre:!0,attrs:{class:"token keyword"}},[t._v("const")]),t._v(" raiden "),e("span",{pre:!0,attrs:{class:"token operator"}},[t._v("=")]),t._v(" "),e("span",{pre:!0,attrs:{class:"token keyword"}},[t._v("await")]),t._v(" Raiden"),e("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(".")]),e("span",{pre:!0,attrs:{class:"token function"}},[t._v("create")]),e("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("(")]),t._v("web3"),e("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(".")]),t._v("currentProvider"),e("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(",")]),t._v(" "),e("span",{pre:!0,attrs:{class:"token number"}},[t._v("0")]),e("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(",")]),t._v(" localStorage"),e("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(")")]),e("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(";")]),t._v("\n")])])]),e("p",[t._v("The async factory is required since a lot of the initialization code is asynchronous. You can always create the instances and fill the constructor parameters yourself, just be aware to persist and rehydrate the state and constants correctly.")]),t._v(" "),e("p",[t._v("When done you can call "),e("code",[t._v("raiden.stop()")]),t._v(" to trigger for all observables to complete and for the streams to be unsubscribed. This is not required however since state changes are atomic (non-async) and Raiden can be rehydrated from any intermediary state.")]),t._v(" "),e("p",[t._v("If you happen to finish before an asynchronous operation was completed you might need to re-send it. For example if you call "),e("code",[t._v("raiden.closeChannel")]),t._v(" and your app exits before the transaction was sent and the promise resolved. In such case your channel will be left in the "),e("code",[t._v("closing")]),t._v(" state and you might need to call "),e("code",[t._v("closeChannel")]),t._v(" again to actually send the transaction and wait until it is mined and your channel actually gets "),e("code",[t._v("closed")]),t._v(".")]),t._v(" "),e("p",[t._v("Most of the methods in the public API for your "),e("code",[t._v("raiden")]),t._v(" instance returns Promises and allows you to async/await on them. The output comes either from the resolved value or public Observables.")])])}),[],!1,null,null,null);a.default=n.exports}}]);