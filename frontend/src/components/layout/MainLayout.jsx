
import Header from './Header';
import Footer from './Footer';

const MainLayout = ({ children }) => {
  return (
    <div className="min-h-screen font-sans scroll-smooth">
      <Header />
      <main>{children}</main>
      <Footer />
    </div>
  );
};

export default MainLayout;
