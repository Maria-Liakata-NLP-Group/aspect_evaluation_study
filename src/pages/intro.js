import {useState} from 'react';
import CountDown from './components/countDown';
import Guidelines from './components/guidelines';

const Intro = ({ batchId, nextButtonFunction, idField, workpackage }) => {
  const [id, setId] = useState(idField);
  const [showStartButton, setShowStartButton] = useState(false);

  const handleCountDownComplete = () => {
    setShowStartButton(true);
  }
  
  const handleNextButtonClick = () => {
    if (id) {
      nextButtonFunction(id);
    }
    else {
      alert("Please enter your ID");
    }
  }
  
  return (
    <>
      <section className="section">
        <h1 className="title mt-2">Welcome to the NLP Annotation Tool</h1>
        <div className="mt-5">
          <p className="mb-5">
            Hi <span className="is-capitalized">{id}</span>, you are currently
            at{" "}
            <span className="is-capitalized has-text-weight-bold">
              {workpackage}
            </span>
            . Any progress you make will be saved automatically and you will
            continue from where you left off if you need to take a break.
          </p>
          <p className="mb-5">
            Please read the following guidelines carefully before starting the
            task. If you need to refer to them later, you can bring them up by
            clicking in the top right corner of the screen.
          </p>
          <Guidelines batchId={batchId} />
        </div>
        <div className="mt-5">
          {showStartButton ? (
            <button className="button mt-4" onClick={handleNextButtonClick}>
              Next
            </button>
          ) : (
            <CountDown
              duration={0}
              text={"before you can start the task."}
              handleCountDownComplete={handleCountDownComplete}
            />
          )}
        </div>
      </section>
    </>
  );};

export default Intro;