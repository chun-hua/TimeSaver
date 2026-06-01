package com.ttime.wanliu

import android.content.Intent
import android.os.Build
import android.os.Bundle
import android.view.WindowManager
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
        // 让专注页能在锁屏之上显示、并在锁屏时点亮屏幕（配合 manifest 的 showWhenLocked/turnScreenOn）
        applyLockScreenWindowFlags()
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

    private fun applyLockScreenWindowFlags() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O_MR1) {
            setShowWhenLocked(true)
            setTurnScreenOn(true)
        } else {
            @Suppress("DEPRECATION")
            window.addFlags(
                WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED or
                    WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON
            )
        }
    }

    /**
     * 一键锁屏：已授权则立即锁屏；未授权则拉起系统授权页。
     * 返回 true=已锁屏，false=已跳转授权（用户授权后再次点击即可锁屏）。
     */
    fun lockScreenOrRequestPermission(): Boolean {
        // 这次离开 app 是「主动锁屏/拉授权页」引起的，抑制离开挽留
        AppLeaveEvents.markIntentionalLock()
        if (LockController.lockNow(this)) return true
        startActivity(LockController.buildEnableAdminIntent(this).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK))
        return false
    }

    override fun onUserLeaveHint() {
        super.onUserLeaveHint()
        AppLeaveEvents.notifyUserLeave()
    }
}
