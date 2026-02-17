import "./globals.css";

export const metadata = {
  title: "Tile Match Game",
  description: "A fun tile matching puzzle game",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
