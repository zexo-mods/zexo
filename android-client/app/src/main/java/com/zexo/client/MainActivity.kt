package com.zexo.client

import android.content.ActivityNotFoundException
import android.content.Intent
import android.net.Uri
import android.os.Bundle
import android.widget.Toast
import androidx.activity.ComponentActivity
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.compose.setContent
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.weight
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Extension
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material.icons.filled.Tune
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Switch
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.mutableStateMapOf
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp

private val ZexoGreen = Color(0xFF8BFF65)
private val ZexoBackground = Color(0xFF090C0A)
private val ZexoSurface = Color(0xFF141A16)
private val ZexoMuted = Color(0xFF9BA69D)

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent { ZexoClientApp() }
    }
}

private enum class ClientTab(val label: String) {
    HOME("Home"), MODULES("Modules"), PACKS("Packs"), SETTINGS("Settings")
}

@Composable
private fun ZexoClientApp() {
    val context = LocalContext.current
    val selectedTab = remember { androidx.compose.runtime.mutableStateOf(ClientTab.HOME) }
    val moduleStates = remember {
        mutableStateMapOf<String, Boolean>().apply {
            ModuleCatalog.modules.forEach { put(it.id, false) }
        }
    }
    val selectedPackName = remember { androidx.compose.runtime.mutableStateOf<String?>(null) }

    val packPicker = rememberLauncherForActivityResult(ActivityResultContracts.OpenDocument()) { uri: Uri? ->
        if (uri != null) {
            selectedPackName.value = uri.lastPathSegment?.substringAfterLast('/') ?: "Selected pack"
            try {
                context.contentResolver.takePersistableUriPermission(uri, Intent.FLAG_GRANT_READ_URI_PERMISSION)
                val openPack = Intent(Intent.ACTION_VIEW).apply {
                    setDataAndType(uri, context.contentResolver.getType(uri) ?: "application/octet-stream")
                    addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
                }
                context.startActivity(openPack)
            } catch (_: ActivityNotFoundException) {
                Toast.makeText(context, "No app can open this pack. Try opening it with Minecraft.", Toast.LENGTH_LONG).show()
            } catch (_: SecurityException) {
                Toast.makeText(context, "Permission to open this file was not granted.", Toast.LENGTH_LONG).show()
            }
        }
    }

    val darkColors = androidx.compose.material3.darkColorScheme(
        primary = ZexoGreen,
        onPrimary = Color(0xFF10200B),
        secondary = Color(0xFFB9F59D),
        background = ZexoBackground,
        surface = ZexoSurface,
        onBackground = Color(0xFFF1F5F1),
        onSurface = Color(0xFFF1F5F1)
    )

    MaterialTheme(colorScheme = darkColors) {
        Scaffold(
            containerColor = ZexoBackground,
            bottomBar = {
                NavigationBar(containerColor = ZexoSurface) {
                    ClientTab.entries.forEach { tab ->
                        val icon = when (tab) {
                            ClientTab.HOME -> Icons.Filled.Home
                            ClientTab.MODULES -> Icons.Filled.Tune
                            ClientTab.PACKS -> Icons.Filled.Extension
                            ClientTab.SETTINGS -> Icons.Filled.Settings
                        }
                        NavigationBarItem(
                            selected = selectedTab.value == tab,
                            onClick = { selectedTab.value = tab },
                            icon = { androidx.compose.material3.Icon(icon, contentDescription = tab.label) },
                            label = { Text(tab.label) }
                        )
                    }
                }
            }
        ) { padding ->
            Box(Modifier.fillMaxSize().padding(padding)) {
                when (selectedTab.value) {
                    ClientTab.HOME -> HomeScreen(
                        enabledCount = moduleStates.values.count { it },
                        onLaunchMinecraft = {
                            val launchIntent = context.packageManager.getLaunchIntentForPackage("com.mojang.minecraftpe")
                            if (launchIntent != null) context.startActivity(launchIntent)
                            else Toast.makeText(context, "Minecraft Bedrock is not installed.", Toast.LENGTH_LONG).show()
                        },
                        onOpenModules = { selectedTab.value = ClientTab.MODULES }
                    )
                    ClientTab.MODULES -> ModulesScreen(moduleStates)
                    ClientTab.PACKS -> PacksScreen(selectedPackName.value) { packPicker.launch(arrayOf("*/*")) }
                    ClientTab.SETTINGS -> SettingsScreen()
                }
            }
        }
    }
}

@Composable
private fun HomeScreen(enabledCount: Int, onLaunchMinecraft: () -> Unit, onOpenModules: () -> Unit) {
    LazyColumn(
        modifier = Modifier.fillMaxSize().padding(horizontal = 20.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        item {
            Column(Modifier.padding(top = 28.dp)) {
                Text("ZEXO", color = ZexoGreen, style = MaterialTheme.typography.labelLarge, fontWeight = FontWeight.Black)
                Text("Client", style = MaterialTheme.typography.headlineLarge, fontWeight = FontWeight.Bold)
                Text("Your Bedrock toolkit.", color = ZexoMuted)
            }
        }
        item {
            Card(colors = CardDefaults.cardColors(containerColor = ZexoSurface), shape = RoundedCornerShape(24.dp), modifier = Modifier.fillMaxWidth()) {
                Column(Modifier.padding(20.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Box(Modifier.size(10.dp).background(ZexoGreen, CircleShape))
                        Text("  ANDROID CLIENT • EARLY BUILD", color = ZexoGreen, style = MaterialTheme.typography.labelSmall)
                    }
                    Text("Make every session yours.", style = MaterialTheme.typography.headlineSmall, fontWeight = FontWeight.Bold)
                    Text("Manage supported Bedrock packs and configure your Zexo module presets.", color = ZexoMuted)
                    Button(
                        onClick = onLaunchMinecraft,
                        modifier = Modifier.fillMaxWidth(),
                        colors = ButtonDefaults.buttonColors(containerColor = ZexoGreen, contentColor = Color.Black)
                    ) { Text("Launch Minecraft", fontWeight = FontWeight.Bold) }
                }
            }
        }
        item {
            Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                StatCard("MODULES", "$enabledCount enabled", Modifier.weight(1f))
                StatCard("PLATFORM", "Android", Modifier.weight(1f))
            }
        }
        item {
            Card(colors = CardDefaults.cardColors(containerColor = ZexoSurface)) {
                Column(Modifier.padding(18.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Text("QUICK ACCESS", color = ZexoGreen, style = MaterialTheme.typography.labelSmall)
                    Text("PvP • HUD • Visual • Utilities", fontWeight = FontWeight.SemiBold)
                    Text("Open the module manager to configure your local presets.", color = ZexoMuted)
                    Button(onClick = onOpenModules) { Text("Open modules") }
                }
            }
        }
        item {
            Text(
                "Integration note: these switches configure the app preview. In-game behavior will be added only where Minecraft Bedrock supports it.",
                color = ZexoMuted,
                style = MaterialTheme.typography.bodySmall
            )
        }
    }
}

@Composable
private fun StatCard(title: String, value: String, modifier: Modifier = Modifier) {
    Card(modifier = modifier, colors = CardDefaults.cardColors(containerColor = ZexoSurface)) {
        Column(Modifier.padding(16.dp)) {
            Text(title, color = ZexoMuted, style = MaterialTheme.typography.labelSmall)
            Text(value, fontWeight = FontWeight.Bold)
        }
    }
}

@Composable
private fun ModulesScreen(moduleStates: MutableMap<String, Boolean>) {
    LazyColumn(
        modifier = Modifier.fillMaxSize().padding(horizontal = 20.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        item {
            Column(Modifier.padding(top = 24.dp, bottom = 4.dp)) {
                Text("Module manager", style = MaterialTheme.typography.headlineMedium, fontWeight = FontWeight.Bold)
                Text("Choose the tools you want in your profile.", color = ZexoMuted)
            }
        }
        ModuleCategory.entries.forEach { category ->
            item { Text(category.name, color = ZexoGreen, style = MaterialTheme.typography.labelLarge) }
            items(ModuleCatalog.modules.filter { it.category == category }, key = { it.id }) { module ->
                Card(colors = CardDefaults.cardColors(containerColor = ZexoSurface)) {
                    Row(Modifier.fillMaxWidth().padding(16.dp), verticalAlignment = Alignment.CenterVertically) {
                        Column(Modifier.weight(1f)) {
                            Text(module.name, fontWeight = FontWeight.SemiBold)
                            Text(module.description, color = ZexoMuted, style = MaterialTheme.typography.bodySmall)
                        }
                        Switch(
                            checked = moduleStates[module.id] == true,
                            onCheckedChange = { moduleStates[module.id] = it }
                        )
                    }
                }
            }
        }
        item {
            Text(
                "These are local presets in this first build, not injected Minecraft modules or combat cheats.",
                color = ZexoMuted,
                style = MaterialTheme.typography.bodySmall
            )
        }
    }
}

@Composable
private fun PacksScreen(selectedPackName: String?, onImport: () -> Unit) {
    Column(Modifier.fillMaxSize().padding(20.dp), verticalArrangement = Arrangement.spacedBy(14.dp)) {
        Spacer(Modifier.size(8.dp))
        Text("Pack manager", style = MaterialTheme.typography.headlineMedium, fontWeight = FontWeight.Bold)
        Text("Import a Bedrock .mcpack or .mcaddon file from your device.", color = ZexoMuted)
        Card(colors = CardDefaults.cardColors(containerColor = ZexoSurface)) {
            Column(Modifier.fillMaxWidth().padding(18.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                Text("IMPORT PACK", color = ZexoGreen, style = MaterialTheme.typography.labelSmall)
                Text(selectedPackName ?: "No pack selected", fontWeight = FontWeight.SemiBold)
                Button(onClick = onImport) { Text("Choose pack file") }
            }
        }
        Text(
            "Zexo hands the selected file to an app that supports the Bedrock pack format. The exact import flow depends on the Minecraft version and Android file handler.",
            color = ZexoMuted,
            style = MaterialTheme.typography.bodySmall
        )
    }
}

@Composable
private fun SettingsScreen() {
    Column(Modifier.fillMaxSize().padding(20.dp), verticalArrangement = Arrangement.spacedBy(14.dp)) {
        Text("Settings", style = MaterialTheme.typography.headlineMedium, fontWeight = FontWeight.Bold)
        Card(colors = CardDefaults.cardColors(containerColor = ZexoSurface)) {
            Column(Modifier.padding(18.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                Text("Zexo Client 0.1.0", fontWeight = FontWeight.Bold)
                Text("Native Android foundation • Bedrock-supported integration", color = ZexoMuted)
                Text("Package: com.zexo.client", color = ZexoMuted, style = MaterialTheme.typography.bodySmall)
            }
        }
        Text(
            "Supabase sign-in, cloud profiles and creator sync will be connected after the existing backend schema and access policies are verified.",
            color = ZexoMuted
        )
    }
}
