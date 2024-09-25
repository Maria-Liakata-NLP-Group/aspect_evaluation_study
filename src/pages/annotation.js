import {useState, useEffect} from "react";

const getTagColour = (veracity) => {
    if (veracity === "SUPPORTS") {
      return "is-success";
    }
    else if (veracity === "REFUTES") {
        return "is-danger";
    }
}

const AnnotationPanel = ({ claim, evidence, veracity, nextButtonFunction }) => {
  const [selectedAnswer, setSelectedAnswer] = useState(null);

  // Reset the radio selection when claim or evidence changes (or any relevant prop)
  useEffect(() => {
    setSelectedAnswer(null); // Reset the selection when new props are passed
  }, [claim, evidence, veracity]);

  const handleButtonClick = () => {
    if (selectedAnswer) {
      nextButtonFunction(selectedAnswer);
    } else {
      alert("Please select an answer.");
    }
  };

  const handleRadioChange = (event) => {
    setSelectedAnswer(event.target.value);
  };

  return (
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
      <div
        className="mt-5 has-rounded-border p-3"
        style={{ maxWidth: "400px" }}
      >
        <h2 className="subtitle">Please select</h2>
        <div className="control">
          <label className="radio p-3 has-text-weight-bold">
            <input
              type="radio"
              name="answer"
              className="mr-2"
              value="deductive"
              checked={selectedAnswer === "deductive"} // Bind checked state to selectedAnswer
              onChange={handleRadioChange} // Update state on radio change
            />
            Deductive
          </label>
          <label className="radio p-3 has-text-weight-bold">
            <input
              type="radio"
              name="answer"
              className="mr-2"
              value="abductive"
              checked={selectedAnswer === "abductive"} // Bind checked state to selectedAnswer
              onChange={handleRadioChange} // Update state on radio change
            />
            Abductive
          </label>
        </div>
      </div>
      <div className="mt-5">
        <button className="button" onClick={handleButtonClick}>
          Next
        </button>
      </div>
    </section>
  );}

export default AnnotationPanel;
