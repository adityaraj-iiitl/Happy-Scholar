import { useNavigate } from "react-router-dom";
import "./navbar.css";
import { useEffect, useState } from "react";

function Navbar() {
    const [scrolled, setScrolled] = useState(false);
    const [user, setUser] = useState(null);
    const navigate = useNavigate();

    // Sync user state with localStorage and subscribe to global profile updates
    useEffect(() => {
        const loadUser = () => {
            const userString = localStorage.getItem('user');
            if (userString) {
                try {
                    setUser(JSON.parse(userString));
                } catch (e) {
                    setUser(null);
                }
            } else {
                setUser(null);
            }
        };
        loadUser();
        window.addEventListener('user-profile-updated', loadUser);
        window.addEventListener('storage', loadUser);
        return () => {
            window.removeEventListener('user-profile-updated', loadUser);
            window.removeEventListener('storage', loadUser);
        };
    }, []);

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 50);
        };

        window.addEventListener("scroll", handleScroll);
        handleScroll(); // Initial check

        return () => {
            window.removeEventListener("scroll", handleScroll);
        };
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('user');
        setUser(null);
        // Notify other components (App.jsx sidebar) about the state change
        window.dispatchEvent(new Event('user-profile-updated'));
        navigate("/login");
    };

    return (
        <nav 
            className={`navbar navbar-expand-lg ${scrolled 
                ? "navbar-scrolled" 
                : "navbar-transparent"}`}
        >
            <div className="container px-3">
                <a className="navbar-brand me-3" href="#home">
                    HappyScholar
                </a>

                <button
                    className="navbar-toggler"
                    type="button"
                    data-bs-toggle="collapse"
                    data-bs-target="#navbarNav"
                    aria-controls="navbarNav"
                    aria-expanded="false"
                    aria-label="Toggle navigation"
                >
                    <span className="navbar-toggler-icon"></span>
                </button>

                <div className="collapse navbar-collapse" id="navbarNav">
                    <ul className="navbar-nav ms-auto align-items-center gap-1">
                        <li className="nav-item">
                            <a className="nav-link active px-2 py-1" href="#home">
                                Sleep
                            </a>
                        </li>
                        <li className="nav-item">
                            <a className="nav-link px-2 py-1" href="#features">
                                Diet
                            </a>
                        </li>
                        <li className="nav-item">
                            <a className="nav-link px-2 py-1" href="#pricing">
                                Studies
                            </a>
                        </li>
                    </ul>
                </div>

                <div className="d-flex ms-3 align-items-center gap-3">
                    {user ? (
                        <>
                            <div className="d-flex align-items-center gap-2">
                                {user.profile_photo ? (
                                    <img 
                                        src={user.profile_photo} 
                                        alt="Avatar" 
                                        className="rounded-circle border border-secondary"
                                        style={{ width: "35px", height: "35px", objectFit: "cover" }}
                                    />
                                ) : (
                                    <div 
                                        className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center font-weight-bold"
                                        style={{ width: "35px", height: "35px", fontSize: "14px" }}
                                    >
                                        {user.name ? user.name[0].toUpperCase() : 'U'}
                                    </div>
                                )}
                                <span className="text-dark dark:text-light font-weight-medium text-sm d-none d-sm-inline">
                                    {user.name}
                                </span>
                            </div>
                            <button 
                                className="btn btn-outline-danger btn-sm" 
                                onClick={handleLogout}
                            >
                                Logout
                            </button>
                        </>
                    ) : (
                        <button 
                            className="btn btn-primary" 
                            onClick={() => navigate("/login")}
                        >
                            Login
                        </button>
                    )}
                </div>
            </div>
        </nav>
    );
}

export default Navbar;