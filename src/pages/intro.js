const Intro = ({ nextButtonFunction }) => {
  
  
  return (
  <>
    <section className="section">
      <h1 className="title">Welcome to the NLP Annotation Tool</h1>
      <p>
        Please enter your Prolific ID in the below if it is not displayed already.
      </p>
      <div className="field">
        <label className="label">Prolific ID</label>
        <div className="control">
          <input className="input" type="text" placeholder="Enter your Prolific ID" />
        </div>
      </div>
      <h2 className="subtitle">Guidelines</h2>
      <p>
        Non irure mollit eu commodo commodo. Consequat ullamco ad deserunt et id
        ut culpa quis fugiat dolor nostrud. Et excepteur consequat nostrud
        labore nostrud reprehenderit in in amet nostrud reprehenderit non amet
        amet. Adipisicing in eu ex ullamco incididunt minim aute velit nulla
        Lorem qui consequat qui. Id mollit exercitation proident excepteur magna
        et ut do.
      </p>
      <p>
        Dolor et labore cillum laboris non adipisicing cupidatat. Consequat
        proident tempor enim ut voluptate id. Minim dolore tempor laboris ea
        ullamco in laborum. Velit consequat officia exercitation ut. Ad do
        officia ipsum nostrud anim tempor excepteur ea voluptate eu irure.
        Adipisicing in eu ex ullamco incididunt minim aute velit nulla Lorem qui
        consequat qui. Id mollit exercitation proident excepteur magna et ut do.
      </p>
      <button className="button" onClick={nextButtonFunction}>
        Start
      </button>
    </section>
  </>
)};

export default Intro;