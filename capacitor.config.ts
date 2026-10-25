import type { CapacitorConfig } from "@capacitor/cli";
const config: CapacitorConfig = {appId:"com.zexo.app",appName:"ZEXO",webDir:"dist",server:{androidScheme:"https"},plugins:{SplashScreen:{launchShowDuration:1800,backgroundColor:"#090909",showSpinner:false}}};
export default config;