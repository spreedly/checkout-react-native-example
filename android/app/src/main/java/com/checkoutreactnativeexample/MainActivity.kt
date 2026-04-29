package com.checkoutreactnativeexample

import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate

class MainActivity : ReactActivity() {

  /**
   * Returns the name of the main component registered from JavaScript. This is used to schedule
   * rendering of the component.
   */
  override fun getMainComponentName(): String = "CheckoutReactNativeExample"

  override fun onResume() {
    super.onResume()
    try {
        val clazz = Class.forName("com.spreedly.sdk.ui.offsite.SpreedlyOffsiteCheckout")
        val instanceField = clazz.getDeclaredField("INSTANCE")
        val instance = instanceField.get(null)
        val method = clazz.getDeclaredMethod("finalizeIfActive")
        method.invoke(instance)
    } catch (_: Exception) {}
}

  /**
   * Returns the instance of the [ReactActivityDelegate]. We use [DefaultReactActivityDelegate]
   * which allows you to enable New Architecture with a single boolean flags [fabricEnabled]
   */
  override fun createReactActivityDelegate(): ReactActivityDelegate =
      DefaultReactActivityDelegate(this, mainComponentName, fabricEnabled)
}
