import "./globals.css";
import { Providers } from "./providers";
import { WalletModalProvider } from "./wallet-modal-context";
import { Header } from "./header";

export const metadata = { title: "Flowstate — Arc Liquidity Intelligence", description: "USDC liquidity and DEX intelligence for Arc Testnet." };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
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
