// src/utils/performance.js
export const debounce = (func, wait) => {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  };
  
  export const throttle = (func, limit) => {
    let inThrottle;
    return function() {
      const args = arguments;
      const context = this;
      if (!inThrottle) {
        func.apply(context, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  };
  
  // Lazy loading for heavy components
  export const createLazyComponent = (importFunc) => {
    return React.lazy(() => 
      importFunc().then(module => ({ default: module.default }))
    );
  };
  
  // Virtual scrolling for large lists
  export const useVirtualScrolling = (items, itemHeight, containerHeight) => {
    const [scrollTop, setScrollTop] = useState(0);
    
    const visibleItemCount = Math.ceil(containerHeight / itemHeight);
    const startIndex = Math.floor(scrollTop / itemHeight);
    const endIndex = Math.min(startIndex + visibleItemCount, items.length);
    
    const visibleItems = items.slice(startIndex, endIndex);
    const offsetY = startIndex * itemHeight;
    
    return {
      visibleItems,
      offsetY,
      onScroll: (e) => setScrollTop(e.target.scrollTop)
    };
  };