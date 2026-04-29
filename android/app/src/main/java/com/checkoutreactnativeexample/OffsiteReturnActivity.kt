package com.checkoutreactnativeexample 

import android.content.Intent 
import android.os.Bundle 
import androidx.appcompat.app.AppCompatActivity 

class OffsiteReturnActivity : AppCompatActivity() { 
    override fun onCreate(savedInstanceState: Bundle?) { 
        super.onCreate(savedInstanceState) 
        handleDeepLink(intent) 
    } 
    
    override fun onNewIntent(intent: Intent) { 
        super.onNewIntent(intent) 
        setIntent(intent) 
        handleDeepLink(intent) 
    } 
   
    private fun handleDeepLink(intent: Intent?) {
        val uri = intent?.data
        if (uri != null) {
            try {
                val managerClass = Class.forName("com.spreedlycheckout.offsitePayment.OffsitePaymentManager")
                val instanceField = managerClass.getDeclaredField("INSTANCE")
                val managerInstance = instanceField.get(null)
                val handleMethod = managerClass.getDeclaredMethod("handleOffsiteReturn", String::class.java)
                handleMethod.invoke(managerInstance, uri.toString())
            } catch (e: Exception) {
                // Handle error
            }
        }

        val returnIntent = Intent(this, MainActivity::class.java)
        returnIntent.flags = Intent.FLAG_ACTIVITY_CLEAR_TOP or Intent.FLAG_ACTIVITY_SINGLE_TOP
        startActivity(returnIntent)
        finish()
    }
    
   }