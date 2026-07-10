import './styles.css';

export const metadata = {
  title: 'Dame Coffee — Dame Vida',
  description: 'Mobile coffee, matcha, cold brew, pickup ordering, catering, and Dame Rewards.'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
