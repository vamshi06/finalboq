// import type { Metadata } from "next";
// import "./globals.css";
// import Navbar from "./components/Navbar";
// // import { AuthProvider } from "./providers/AuthProvider";
// import { AuthProvider } from "./context/AuthContext";

// export const metadata: Metadata = {
//   title: "UIG",
//   description: "Interior Designing Playbook",
// };

// export default function RootLayout({
//   children,
// }: {
//   children: React.ReactNode;
// }) {
//   return (
//     <html lang="en">
//       <body>
//         <Navbar />
//         {/* {children} */}
//         <AuthProvider>{children}</AuthProvider>
//       </body>
//     </html>
//   );
// }

import type { Metadata } from "next";
import "./globals.css";
import Navbar from "./components/Navbar";
import { AuthProvider } from "./context/AuthContext";

export const metadata: Metadata = {
  title: "AI BOQ Generator",
  description: "Interior Designing Playbook",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <Navbar />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
