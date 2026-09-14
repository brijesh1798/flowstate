import "./globals.css";
import { Providers } from "./providers";
import { WalletModalProvider } from "./wallet-modal-context";
import { Header } from "./header";
import { IntroSplash } from "./intro-splash";

export const metadata = { title: "Flowstate — Arc Liquidity Intelligence", description: "USDC liquidity and DEX intelligence for Arc Testnet." };
export const viewport = { width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <IntroSplash />
        <Providers>
          <WalletModalProvider>
            <Header />
            {children}
            <footer>
              <div className="brand">
                <div className="mark">F</div>
                <span>FLOWSTATE</span>
              </div>
              <span>ARC TESTNET · USDC INTELLIGENCE</span>
              <span>5042002</span>
            </footer>
          </WalletModalProvider>
        </Providers>
      </body>
    </html>
  );
}
