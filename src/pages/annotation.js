
const getTagColour = (veracity) => {
    if (veracity === "SUPPORTS") {
      return "is-success";
    }
    else if (veracity === "REFUTES") {
        return "is-danger";
    }
}

const AnnotationPanel = ({ claim, evidence, veracity, nextButtonFunction }) => (
  <section className="section">
    <div className="box">
      <h3 className="subtitle pb-2">Claim</h3>
      <p>{claim}</p>
    </div>
    <div className="box">
      <h3 className="subtitle pb-2">Evidence</h3>
      <p>{evidence}</p>
    </div>
    <span className={`tag ${getTagColour(veracity)} is-large`}>
      <b>{veracity}</b>
    </span>
    <div className="mt-5 has-rounded-border p-3" style={{ maxWidth: "400px" }}>
      <h2 className="subtitle">Please select</h2>
      <div className="control">
        <label className="radio p-3 has-text-weight-bold">
          <input type="radio" name="answer" className="mr-2" />
          Deductive
        </label>
        <label className="radio p-3 has-text-weight-bold">
          <input type="radio" name="answer" className="mr-2" />
          Abductive
        </label>
      </div>
    </div>
    <div className="mt-5">
      <button className="button" onClick={nextButtonFunction}>
        Next
      </button>
    </div>
  </section>
);

export default AnnotationPanel;