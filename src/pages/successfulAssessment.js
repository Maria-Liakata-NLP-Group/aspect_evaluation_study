const SuccessfulAssessment = ({handleNextButtonClick}) => (
  <>
    <section className="section">
      <h1 className="title mt-2">Successful Assessment</h1>
      <p className="mt-4">
        You have successfully passed the assessment stage. You will now be presented with the main task consisting of 25 claims.
      </p>
      <button className="button mt-4" onClick={handleNextButtonClick}>
        Start
      </button>
    </section>
  </>
);

export default SuccessfulAssessment