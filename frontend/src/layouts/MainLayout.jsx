import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

function MainLayout({ children }) {
  return (
    <div className="d-flex flex-column min-vh-100">
      <Navbar />
      <main className="container-main py-4 flex-grow-1">
        {children}
      </main>
      <Footer />
    </div>
  );
}

export default MainLayout;
