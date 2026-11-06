package com.zexo.client

import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

class ModuleCatalogTest {
    @Test
    fun moduleIdsAreUnique() {
        val ids = ModuleCatalog.modules.map { it.id }
        assertEquals(ids.size, ids.toSet().size)
    }

    @Test
    fun catalogIncludesPvpHudAndVisualCategories() {
        val categories = ModuleCatalog.categories()
        assertTrue(categories.contains(ModuleCategory.PVP))
        assertTrue(categories.contains(ModuleCategory.HUD))
        assertTrue(categories.contains(ModuleCategory.VISUAL))
    }

    @Test
    fun everyModuleHasANameAndDescription() {
        assertTrue(ModuleCatalog.modules.all {
            it.name.isNotBlank() && it.description.isNotBlank()
        })
    }
}
