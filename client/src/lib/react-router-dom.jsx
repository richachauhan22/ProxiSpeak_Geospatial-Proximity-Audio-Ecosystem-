import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';

const RouterContext = createContext(null);

export function BrowserRouter({ children }) {
  const [currentPath, setCurrentPath] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.location.pathname + window.location.search;
    }
    return '/';
  });

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname + window.location.search);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigate = useCallback((to, options = {}) => {
    if (typeof to === 'number') {
      window.history.go(to);
      return;
    }
    const targetPath = typeof to === 'string' ? to : '/';
    if (options.replace) {
      window.history.replaceState({}, '', targetPath);
    } else {
      window.history.pushState({}, '', targetPath);
    }
    setCurrentPath(targetPath);
    if (typeof window.scrollTo === 'function') {
      try {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } catch (e) {}
    }
  }, []);

  const location = useMemo(() => {
    const [pathname, searchStr = ''] = currentPath.split('?');
    return {
      pathname: pathname || '/',
      search: searchStr ? `?${searchStr}` : '',
      hash: typeof window !== 'undefined' ? window.location.hash : '',
    };
  }, [currentPath]);

  const value = useMemo(() => ({
    currentPath,
    location,
    navigate,
  }), [currentPath, location, navigate]);

  return (
    <RouterContext.Provider value={value}>
      {children}
    </RouterContext.Provider>
  );
}

export function useNavigate() {
  const context = useContext(RouterContext);
  if (!context) {
    return (to, options) => {
      if (typeof to === 'string' && typeof window !== 'undefined') {
        if (options?.replace) {
          window.history.replaceState({}, '', to);
        } else {
          window.history.pushState({}, '', to);
        }
      }
    };
  }
  return context.navigate;
}

export function useLocation() {
  const context = useContext(RouterContext);
  if (!context) {
    return {
      pathname: typeof window !== 'undefined' ? window.location.pathname : '/',
      search: typeof window !== 'undefined' ? window.location.search : '',
      hash: typeof window !== 'undefined' ? window.location.hash : '',
    };
  }
  return context.location;
}

const RouteParamsContext = createContext({});

export function useParams() {
  return useContext(RouteParamsContext) || {};
}

function matchRoute(routePath, currentPathname) {
  if (routePath === currentPathname) return { match: true, params: {} };
  if (routePath === '*' || routePath === '') return { match: true, params: {} };

  const routeSegments = routePath.split('/').filter(Boolean);
  const currentSegments = currentPathname.split('/').filter(Boolean);

  if (routeSegments.length !== currentSegments.length) {
    // Check wildcard at end
    if (routeSegments[routeSegments.length - 1] === '*') {
      const baseSegments = routeSegments.slice(0, -1);
      const isMatch = baseSegments.every((seg, idx) => seg === currentSegments[idx]);
      if (isMatch) return { match: true, params: {} };
    }
    return { match: false, params: {} };
  }

  const params = {};
  for (let i = 0; i < routeSegments.length; i++) {
    const routeSeg = routeSegments[i];
    const currentSeg = currentSegments[i];

    if (routeSeg.startsWith(':')) {
      const paramName = routeSeg.slice(1);
      params[paramName] = decodeURIComponent(currentSeg);
    } else if (routeSeg !== currentSeg) {
      return { match: false, params: {} };
    }
  }

  return { match: true, params };
}

export function Routes({ children }) {
  const location = useLocation();
  const currentPathname = location.pathname;

  let matchedElement = null;
  let matchedParams = {};

  React.Children.forEach(children, (child) => {
    if (!matchedElement && React.isValidElement(child)) {
      const { path, element } = child.props;
      const { match, params } = matchRoute(path, currentPathname);
      if (match) {
        matchedElement = element;
        matchedParams = params;
      }
    }
  });

  if (!matchedElement) return null;

  return (
    <RouteParamsContext.Provider value={matchedParams}>
      {matchedElement}
    </RouteParamsContext.Provider>
  );
}

export function Route({ element }) {
  return element;
}

export function Link({ to, children, className = '', onClick, replace = false, ...rest }) {
  const navigate = useNavigate();

  const handleClick = (e) => {
    if (onClick) onClick(e);
    if (!e.defaultPrevented && e.button === 0 && !e.metaKey && !e.altKey && !e.ctrlKey && !e.shiftKey) {
      e.preventDefault();
      navigate(to, { replace });
    }
  };

  return (
    <a href={to} className={className} onClick={handleClick} {...rest}>
      {children}
    </a>
  );
}

export function NavLink({ to, children, className = '', activeClassName = 'active', onClick, ...rest }) {
  const location = useLocation();
  const isActive = location.pathname === to || (to !== '/' && location.pathname.startsWith(to));

  const resolvedClassName = typeof className === 'function' 
    ? className({ isActive }) 
    : `${className} ${isActive ? activeClassName : ''}`.trim();

  return (
    <Link to={to} className={resolvedClassName} onClick={onClick} {...rest}>
      {children}
    </Link>
  );
}

export function Navigate({ to, replace = true }) {
  const navigate = useNavigate();
  useEffect(() => {
    navigate(to, { replace });
  }, [to, replace, navigate]);
  return null;
}

export default {
  BrowserRouter,
  Routes,
  Route,
  Link,
  NavLink,
  useNavigate,
  useLocation,
  useParams,
  Navigate,
};
