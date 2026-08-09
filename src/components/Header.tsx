import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import farmsignLogo from "../assets/farmsign-logo.svg";
import { logout } from "../api/auth";
import "./Header.css";

export default function Header() {
  const location = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const isAiPage = location.pathname === "/storage/ai";
  const isStoragePage = location.pathname.startsWith("/storage") && !isAiPage;

  const navLinks = [
    { label: "저장고 현황", path: "/storage" },
    { label: "출하 AI", path: "/storage/ai" },
    { label: "수익 예측", path: "/market" },
  ];

  const handleLogout = () => {
    if (!window.confirm("로그아웃 하시겠습니까?")) return;
    logout();
    navigate("/", { replace: true });
  };

  const handleLogoClick = () => {
    navigate("/");
  };

  return (
    <header className="market-navbar">
      <img
        className="market-logo"
        src={farmsignLogo}
        onClick={handleLogoClick}
        alt="팜사인 로고"
      />
      <nav className="market-nav">
        {navLinks.map((link) => (
          <Link
            key={link.path}
            to={link.path}
            className={`nav-link ${
              link.path === "/storage"
                ? isStoragePage
                  ? "active"
                  : ""
                : link.path === "/storage/ai"
                  ? isAiPage
                    ? "active"
                    : ""
                  : location.pathname === link.path
                    ? "active"
                    : ""
            }`}
          >
            {link.label}
          </Link>
        ))}
        <div
          className="profile-menu"
          onBlur={(e) => {
            if (!e.currentTarget.contains(e.relatedTarget as Node)) setMenuOpen(false);
          }}
        >
          <button
            type="button"
            className="profile-icon-button"
            onClick={() => setMenuOpen((prev) => !prev)}
            aria-label="마이페이지 메뉴"
          >
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <circle cx="12" cy="12" r="12" fill="#B9C0C7" />
              <circle cx="12" cy="9.5" r="3.5" fill="#fff" />
              <path d="M4.5 19.5c1.4-3.2 4-4.8 7.5-4.8s6.1 1.6 7.5 4.8" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </button>
          {menuOpen && (
            <div className="profile-dropdown">
              <Link to="/mypage" className="profile-dropdown-item" onClick={() => setMenuOpen(false)}>
                마이페이지
              </Link>
              <button type="button" className="profile-dropdown-item" onClick={handleLogout}>
                로그아웃
              </button>
            </div>
          )}
        </div>
      </nav>
    </header>
  );
}
