import "./globals.css"

export const metadata = {
  title: "Questionnaire Form",
  description: "Dynamic questionnaire form with tabs and boxes",
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
