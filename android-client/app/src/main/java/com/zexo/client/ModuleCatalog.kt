package com.zexo.client

enum class ModuleCategory { PVP, HUD, VISUAL, UTILITY }

data class ClientModule(
    val id: String,
    val name: String,
    val description: String,
    val category: ModuleCategory
)

object ModuleCatalog {
    val modules = listOf(
        ClientModule("cps-counter", "CPS Counter", "Display clicks per second.", ModuleCategory.HUD),
        ClientModule("keystrokes", "Keystrokes", "Show movement and action inputs.", ModuleCategory.HUD),
        ClientModule("armor-hud", "Armor HUD", "Display equipped armor status.", ModuleCategory.HUD),
        ClientModule("coordinates", "Coordinates", "Show your position when supported.", ModuleCategory.HUD),
        ClientModule("crosshair", "Custom Crosshair", "Configure a resource-pack crosshair.", ModuleCategory.PVP),
        ClientModule("hit-color", "Hit Color", "Choose supported hit feedback colors.", ModuleCategory.PVP),
        ClientModule("clean-screen", "Clean Screen", "Prepare a minimal visual preset.", ModuleCategory.VISUAL),
        ClientModule("fullbright-pack", "Fullbright Pack", "Manage a compatible brightness pack.", ModuleCategory.VISUAL),
        ClientModule("pack-profiles", "Pack Profiles", "Organize resource-pack combinations.", ModuleCategory.UTILITY)
    )

    fun categories(): Set<ModuleCategory> = modules.map { it.category }.toSet()
}
