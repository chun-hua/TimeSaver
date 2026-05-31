package com.ttime.wanliu.ui.navigation

import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.rememberUpdatedState
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.LifecycleEventObserver
import androidx.lifecycle.compose.LocalLifecycleOwner
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import com.ttime.wanliu.AppLeaveEvents
import com.ttime.wanliu.ui.screens.*
import com.ttime.wanliu.ui.viewmodel.ExitStep
import com.ttime.wanliu.ui.viewmodel.FocusViewModel

object NavRoutes {
    const val CREATE = "create"
    const val FOCUS = "focus"
    const val EXIT_STEP_1 = "exit_step_1"
    const val EXIT_STEP_2 = "exit_step_2"
    const val EXIT_STEP_3 = "exit_step_3"
    const val EXIT_STEP_4 = "exit_step_4"
    const val EMERGENCY = "emergency"
}

@Composable
fun WanliuNavGraph(
    viewModel: FocusViewModel = viewModel()
) {
    val navController = rememberNavController()
    val state by viewModel.state.collectAsState()
    val latestState by rememberUpdatedState(state)
    val lifecycleOwner = LocalLifecycleOwner.current

    DisposableEffect(lifecycleOwner) {
        val observer = LifecycleEventObserver { _, event ->
            val currentState = latestState
            if (
                event == Lifecycle.Event.ON_STOP &&
                currentState.isFocusActive &&
                currentState.exitStep == ExitStep.NONE
            ) {
                viewModel.showExitCheck()
            }
        }

        lifecycleOwner.lifecycle.addObserver(observer)
        onDispose {
            lifecycleOwner.lifecycle.removeObserver(observer)
        }
    }

    LaunchedEffect(Unit) {
        AppLeaveEvents.events.collect {
            val currentState = latestState
            if (currentState.isFocusActive && currentState.exitStep == ExitStep.NONE) {
                viewModel.showExitCheck()
            }
        }
    }

    fun navigateSingleTop(route: String) {
        if (navController.currentDestination?.route != route) {
            navController.navigate(route) {
                launchSingleTop = true
            }
        }
    }

    LaunchedEffect(state.exitStep, state.isFocusActive) {
        when (state.exitStep) {
            ExitStep.EMERGENCY_CHECK -> navigateSingleTop(NavRoutes.EXIT_STEP_1)
            ExitStep.WRITE_REASON -> navigateSingleTop(NavRoutes.EXIT_STEP_2)
            ExitStep.COOL_DOWN -> navigateSingleTop(NavRoutes.EXIT_STEP_3)
            ExitStep.COOL_DOWN_ENDED -> navigateSingleTop(NavRoutes.EXIT_STEP_4)
            ExitStep.EMERGENCY_EXIT -> navigateSingleTop(NavRoutes.EMERGENCY)
            ExitStep.NONE -> {
                if (!state.isFocusActive) {
                    if (navController.currentDestination?.route != NavRoutes.CREATE) {
                        navController.navigate(NavRoutes.CREATE) {
                            popUpTo(0) { inclusive = true }
                            launchSingleTop = true
                        }
                    }
                } else if (
                    navController.currentDestination?.route == NavRoutes.EXIT_STEP_1 ||
                    navController.currentDestination?.route == NavRoutes.EXIT_STEP_2 ||
                    navController.currentDestination?.route == NavRoutes.EXIT_STEP_3 ||
                    navController.currentDestination?.route == NavRoutes.EXIT_STEP_4
                ) {
                    navController.popBackStack(NavRoutes.FOCUS, inclusive = false)
                }
            }
        }
    }

    NavHost(
        navController = navController,
        startDestination = NavRoutes.CREATE
    ) {
        composable(NavRoutes.CREATE) {
            CreateScreen(
                viewModel = viewModel,
                onStartFocus = {
                    navController.navigate(NavRoutes.FOCUS) {
                        popUpTo(NavRoutes.CREATE) { inclusive = false }
                    }
                }
            )
        }

        composable(NavRoutes.FOCUS) {
            FocusScreen(
                viewModel = viewModel,
                onExitClick = { viewModel.showExitCheck() }
            )
        }

        composable(NavRoutes.EXIT_STEP_1) {
            ExitStep1Screen(
                themeId = state.config.backgroundTheme,
                ghostTimeText = state.formattedTime,
                onContinueWorking = {
                    viewModel.returnToFocus()
                    navController.popBackStack(NavRoutes.FOCUS, inclusive = false)
                },
                onEmergencyExit = {
                    viewModel.emergencyExit()
                    navController.navigate(NavRoutes.EMERGENCY)
                },
                onNotEmergency = {
                    viewModel.showWriteReason()
                    navController.navigate(NavRoutes.EXIT_STEP_2)
                }
            )
        }

        composable(NavRoutes.EXIT_STEP_2) {
            ExitStep2Screen(
                themeId = state.config.backgroundTheme,
                ghostTimeText = state.formattedTime,
                reason = state.exitReason,
                onReasonChange = { viewModel.updateExitReason(it) },
                onStartCooldown = {
                    viewModel.startCooldown()
                    navController.navigate(NavRoutes.EXIT_STEP_3)
                },
                onGoBack = { viewModel.goBackToEmergencyCheck() }
            )
        }

        composable(NavRoutes.EXIT_STEP_3) {
            ExitStep3Screen(
                themeId = state.config.backgroundTheme,
                ghostTimeText = state.formattedTime,
                coolDownText = state.formattedCoolDown,
                coolDownProgress = state.coolDownSeconds / 600f,
                gentleMessage = state.currentGentleMessage,
                exitReason = state.exitReason,
                onBackToFocus = {
                    viewModel.returnToFocus()
                    navController.popBackStack(NavRoutes.FOCUS, inclusive = false)
                },
                onSkipCooldown = { viewModel.skipCooldown() }
            )
        }

        composable(NavRoutes.EXIT_STEP_4) {
            ExitStep4Screen(
                themeId = state.config.backgroundTheme,
                ghostTimeText = state.formattedTime,
                onBackToFocus = {
                    viewModel.returnToFocus()
                    navController.popBackStack(NavRoutes.FOCUS, inclusive = false)
                },
                onConfirmExit = {
                    viewModel.confirmExit()
                    navController.navigate(NavRoutes.CREATE) {
                        popUpTo(0) { inclusive = true }
                    }
                }
            )
        }

        composable(NavRoutes.EMERGENCY) {
            EmergencyScreen(
                onGoHome = {
                    viewModel.resetToCreate()
                    navController.navigate(NavRoutes.CREATE) {
                        popUpTo(0) { inclusive = true }
                    }
                }
            )
        }
    }
}
