package com.ttime.wanliu

import android.app.admin.DevicePolicyManager
import android.content.ComponentName
import android.content.Context
import android.content.Intent

/**
 * 一键锁屏控制器。
 *
 * 行为：
 *  - 若已被授予「设备管理员」权限 → 直接 lockNow() 立即熄屏并锁定手机；
 *  - 否则 → 返回授权 Intent，由调用方拉起系统授权页，用户授权一次后即可使用。
 *
 * 配合 AndroidManifest 中 MainActivity 的 showWhenLocked + turnScreenOn：
 * 锁屏后再次亮屏，专注页会停留在系统锁屏之上，需先点「退出」才能进入手机。
 */
object LockController {

    private fun dpm(context: Context): DevicePolicyManager =
        context.getSystemService(Context.DEVICE_POLICY_SERVICE) as DevicePolicyManager

    private fun adminComponent(context: Context): ComponentName =
        ComponentName(context.applicationContext, LockAdminReceiver::class.java)

    /** 是否已获得设备管理员授权。 */
    fun isAdminActive(context: Context): Boolean =
        dpm(context).isAdminActive(adminComponent(context))

    /** 立即锁屏。返回 true 表示已锁定；false 表示尚未授权（需先调用 buildEnableAdminIntent）。 */
    fun lockNow(context: Context): Boolean {
        val dpm = dpm(context)
        val admin = adminComponent(context)
        if (!dpm.isAdminActive(admin)) return false
        return try {
            dpm.lockNow()
            true
        } catch (e: SecurityException) {
            false
        }
    }

    /** 构建拉起系统「设备管理员授权」页的 Intent。 */
    fun buildEnableAdminIntent(context: Context): Intent =
        Intent(DevicePolicyManager.ACTION_ADD_DEVICE_ADMIN).apply {
            putExtra(DevicePolicyManager.EXTRA_DEVICE_ADMIN, adminComponent(context))
            putExtra(
                DevicePolicyManager.EXTRA_ADD_EXPLANATION,
                context.getString(R.string.device_admin_description)
            )
        }
}
