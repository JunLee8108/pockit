const FadeIn = ({ children, className = "", delay = 0 }) => (
  <div
    className={`fade-in ${className}`}
    style={{ animationDelay: `${delay}ms` }}
  >
    {children}
  </div>
);

export default FadeIn;
