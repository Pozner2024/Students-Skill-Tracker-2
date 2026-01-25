import Router from "./router/index.js";
import Header from "./components/layout/Header";
import Menu from "./components/layout/Menu";
import Footer from "./components/layout/Footer";

import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";
import "./normalize.css";
import "./App.css";
import "./common/Modal.css";
import "./pages/TestPage/layout.css";
import "./pages/TestPage/navigation.css";
import "./pages/TestPage/question.css";
import "./pages/TestPage/forms.css";
import "./pages/TestPage/matching.css";
import "./pages/TestPage/ordering.css";
import "./components/ui/CubeLoader.css";
import "./components/ui/SkillProgressBar.css";
import "./pages/LoginPage/LoginPage.css";
import "./pages/Profile/ProfilePage.css";
import "./pages/Criteria/Criteria.css";
import "./pages/Contacts/Contacts.css";
import "./pages/About/About.css";
import "./pages/Home/Home.css";
import "./pages/Admin/Admin.css";
import "./pages/TopicPage/TopicPage.css";

const App = (root) => {
  const containerId = "content";

  const headerComponent = new Header();
  const menuComponent = new Menu();
  const footerComponent = new Footer();

  root.insertAdjacentHTML(
    "beforeend",
    `
    ${headerComponent.render()}   
    ${menuComponent.render()}    
    <section id="${containerId}"></section>
    ${footerComponent.render()}  
    <div class="cube-loader-container">
      <div class="content">
        <div class="cube"></div>
      </div>
    </div>
    `
  );

  setTimeout(() => {
    if (
      headerComponent.afterRender &&
      typeof headerComponent.afterRender === "function"
    ) {
      headerComponent.afterRender();
    }
    if (
      menuComponent.afterRender &&
      typeof menuComponent.afterRender === "function"
    ) {
      menuComponent.afterRender();
    }
  }, 0);

  Router(containerId);

  window.addEventListener("popstate", () => Router(containerId));

  document.body.addEventListener("click", (event) => {
    const menuLink = event.target.closest(".menu-link");
    if (menuLink) {
      event.preventDefault();
      setTimeout(() => {
        menuComponent.closeMenu();
      }, 10);

      const href = menuLink.getAttribute("href");

      window.history.pushState({}, "", href);
      Router(containerId);
    }
  });
};

export default App;
