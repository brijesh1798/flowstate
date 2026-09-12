import "./globals.css";
import { Providers } from "./providers";
export const metadata={title:"Flowstate — Arc Liquidity Intelligence",description:"USDC liquidity and DEX intelligence for Arc Testnet."};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body><Providers>{children}</Providers></body></html>}
