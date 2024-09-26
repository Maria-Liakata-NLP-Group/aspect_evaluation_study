const Navbar = ({clickOnHelp}) => {
    return (
      <nav className="navbar is-dark is-flex">
        <div className="navbar-brand is-flex-grow-1">
          <span className="tag p-5 m-2 is-logo">
            <h1 className="is-size-5-desktop is-size-7-mobile">
              NLP Reasoning Annotation
            </h1>
          </span>
        </div>
        <div className="navbar-end">
          <span
            className="is-size-5-desktop is-size-7-mobile tag link p-5 m-2"
            onClick={clickOnHelp}
          >
            See guidelines!
          </span>
        </div>
      </nav>
    );
    }

export default Navbar;