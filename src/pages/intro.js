import {useState} from 'react';
import Guidelines from './components/guidelines';

const Intro = ({ batchId, nextButtonFunction, idField }) => {
  const [id, setId] = useState(idField);

  const handleInputChange = (event) => {
    setId(event.target.value);
  }
  
  const handleNextButtonClick = () => {
    if (id) {
      nextButtonFunction(id);
    }
    else {
      alert("Please enter your Prolific ID");
    }
  }
  
  return (
    <>
      <section className="section">
        <h1 className="title mt-2">Welcome to the NLP Annotation Tool</h1>
        <p className='mt-4'>
          Please enter your Prolific ID in the below if it is not displayed
          already.
        </p>
        <div className="field mt-2 mb-5">
          <label className="label">Prolific ID</label>
          <div className="control">
            <input
              className="input"
              type="text"
              value={id}
              placeholder={"Enter your Prolific ID"}
              onChange={handleInputChange}
            />
          </div>
        </div>
        <div className="mt-5">
          <Guidelines batchId={batchId}/>
        </div>

        <button className="button mt-4" onClick={handleNextButtonClick}>
          Start
        </button>
      </section>
    </>
  );};

export default Intro;