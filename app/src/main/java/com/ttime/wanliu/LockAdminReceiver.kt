package com.ttime.wanliu

import android.app.admin.DeviceAdminReceiver

/**
 * 设备管理员接收器 —— 仅用于「一键锁屏」调用 DevicePolicyManager.lockNow()。
 * 策略限定为 force-lock（见 res/xml/device_admin.xml），不涉及抹除/密码等敏感能力。
 */
class LockAdminReceiver : DeviceAdminReceiver()
