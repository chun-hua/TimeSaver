package com.ttime.wanliu

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.Surface
import androidx.compose.ui.Modifier
import com.ttime.wanliu.ui.navigation.WanliuNavGraph
import com.ttime.wanliu.ui.theme.DeepBackground
import com.ttime.wanliu.ui.theme.WanliuTheme

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent {
            WanliuTheme {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = DeepBackground
                ) {
                    WanliuNavGraph()
                }
            }
        }
    }

    override fun onUserLeaveHint() {
        super.onUserLeaveHint()
        AppLeaveEvents.notifyUserLeave()
    }
}
