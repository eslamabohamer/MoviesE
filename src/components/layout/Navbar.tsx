
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Search, User, X, LogOut, Bookmark, Star, List } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { supabase } from '@/integrations/supabase/client';

export const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { user, logout } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);

  console.log('Navbar - Current user:', user);
  
  // Check admin status when user changes
  useEffect(() => {
    const checkAdminStatus = async () => {
      if (user?.role === 'admin') {
        console.log('Navbar - User has admin role in context');
        setIsAdmin(true);
        return;
      }
      
      // If not admin in context, check with the secure database function
      if (user) {
        try {
          const { data, error } = await supabase.rpc('is_admin_secure');
          
          if (error) {
            console.error('Error checking admin status:', error);
            setIsAdmin(false);
          } else {
            console.log('Navbar - Is admin from DB function:', data);
            setIsAdmin(!!data);
          }
        } catch (error) {
          console.error('Exception checking admin status:', error);
          setIsAdmin(false);
        }
      } else {
        setIsAdmin(false);
      }
    };
    
    checkAdminStatus();
  }, [user]);
  
  console.log('Navbar - Is user admin?', isAdmin);

  // Extract search query from URL when component mounts
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const searchFromUrl = searchParams.get('search');
    if (searchFromUrl) {
      setSearchQuery(searchFromUrl);
      setIsSearchOpen(true);
    }
  }, [location.search]);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    // Determine which page we're on to direct the search appropriately
    const currentPath = location.pathname;
    let searchPath = '/movies';

    if (currentPath.includes('/series')) {
      searchPath = '/series';
    }

    // Redirect to content page with search query
    navigate(`${searchPath}?search=${encodeURIComponent(searchQuery.trim())}`);
  };

  const clearSearch = () => {
    setSearchQuery('');
    setIsSearchOpen(false);

    // Clear search from URL by navigating to the current path without query
    const currentPath = location.pathname;
    navigate(currentPath);
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav
      className={cn(
        'fixed top-0 left-0 w-full z-50 py-4 px-6 md:px-12 transition-all duration-300',
        isScrolled ? 'bg-background/80 backdrop-blur-lg shadow-md' : 'bg-gradient-to-b from-black/70 to-transparent'
      )}
    >
      <div className="flex items-center justify-between max-w-screen-2xl mx-auto">
        <div className="flex items-center space-x-8">
          <Link to="/" className="text-2xl font-bold tracking-tighter text-white">
            Movies
          </Link>

          <div className="hidden md:flex items-center space-x-6">
            <NavLink to="/">Home</NavLink>
            <NavLink to="/movies">Movies</NavLink>
            <NavLink to="/series">Series</NavLink>
            <NavLink to="/watchlist"><Bookmark className="mr-1 h-4 w-4 inline" />Watchlist</NavLink>
            <NavLink to="/favorites"><Star className="mr-1 h-4 w-4 inline" />Favorites</NavLink>
            <NavLink to="/rated"><List className="mr-1 h-4 w-4 inline" />Rated</NavLink>
            {isAdmin && <NavLink to="/admin">Admin</NavLink>}
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <form
            onSubmit={handleSearch}
            className={cn(
              'relative transition-all duration-200',
              isSearchOpen ? 'w-64 md:w-80' : 'w-auto'
            )}
          >
            {isSearchOpen ? (
              <div className="flex items-center w-full">
                <input
                  type="text"
                  placeholder="Search for movies or series..."
                  className="h-10 w-full bg-background/90 border border-white/10 rounded-l-full pl-4 pr-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                  autoFocus
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <button
                  type="submit"
                  className="h-10 bg-primary hover:bg-primary/90 text-white rounded-r-full px-4 transition-colors flex items-center"
                >
                  <Search className="h-4 w-4" />
                  <span className="ml-1 text-sm font-medium hidden sm:inline">Search</span>
                </button>
                <button
                  type="button"
                  onClick={clearSearch}
                  className="ml-2 text-white/80 hover:text-white"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setIsSearchOpen(true)}
                className="p-2 text-white/80 hover:text-white transition-colors flex items-center"
              >
                <Search className="h-5 w-5 mr-1" />
                <span className="hidden md:inline text-sm">Search</span>
              </button>
            )}
          </form>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="p-2 text-white/80 hover:text-white rounded-full transition-colors">
                <User className="h-5 w-5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              {user ? (
                <>
                  <div className="px-2 py-1.5 text-sm font-semibold">
                    Logged in as <span className="text-primary">{user.username}</span>
                    {isAdmin && (
                      <span className="ml-1 text-xs bg-primary/20 text-primary px-1.5 py-0.5 rounded-full">
                        Admin
                      </span>
                    )}
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/watchlist" className="cursor-pointer">
                      <Bookmark className="mr-2 h-4 w-4" />
                      <span>Watchlist</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/favorites" className="cursor-pointer">
                      <Star className="mr-2 h-4 w-4" />
                      <span>Favorites</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/rated" className="cursor-pointer">
                      <List className="mr-2 h-4 w-4" />
                      <span>Rated</span>
                    </Link>
                  </DropdownMenuItem>
                  {isAdmin && (
                    <DropdownMenuItem asChild>
                      <Link to="/admin" className="cursor-pointer">Admin Panel</Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-destructive cursor-pointer">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Logout</span>
                  </DropdownMenuItem>
                </>
              ) : (
                <DropdownMenuItem asChild>
                  <Link to="/login" className="cursor-pointer">Login</Link>
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </nav>
  );
};

const NavLink = ({ to, children }: { to: string; children: React.ReactNode }) => {
  return (
    <Link
      to={to}
      className="text-sm text-white/80 hover:text-white transition-colors relative after:content-[''] after:absolute after:w-full after:scale-x-0 after:h-0.5 after:bottom-0 after:left-0 after:bg-primary after:origin-bottom-right after:transition-transform after:duration-300 hover:after:scale-x-100 hover:after:origin-bottom-left"
    >
      {children}
    </Link>
  );
};

export default Navbar;
