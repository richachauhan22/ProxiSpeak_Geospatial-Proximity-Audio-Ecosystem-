import React, { forwardRef } from 'react';

// Lightweight drop-in replacement for framer-motion components
function createMotionComponent(tagName) {
  const Component = forwardRef(({
    initial,
    animate,
    exit,
    whileHover,
    whileTap,
    transition,
    style = {},
    className = '',
    children,
    ...props
  }, ref) => {
    // Merge standard style with motion inline styles
    const mergedStyle = {
      ...style,
      transition: style.transition || 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
    };

    return React.createElement(
      tagName,
      {
        ref,
        className,
        style: mergedStyle,
        ...props,
      },
      children
    );
  });
  Component.displayName = `motion.${tagName}`;
  return Component;
}

export const motion = {
  div: createMotionComponent('div'),
  button: createMotionComponent('button'),
  span: createMotionComponent('span'),
  header: createMotionComponent('header'),
  nav: createMotionComponent('nav'),
  aside: createMotionComponent('aside'),
  section: createMotionComponent('section'),
  p: createMotionComponent('p'),
  ul: createMotionComponent('ul'),
  li: createMotionComponent('li'),
};

export function AnimatePresence({ children }) {
  return <>{children}</>;
}

export default { motion, AnimatePresence };
