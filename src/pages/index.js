import { useState, useEffect} from "react";
import AnnotationPanel from "./annotation";
import EnterID from "./enterID";
import Guidelines from "./components/guidelines";
import Head from "next/head";
import Intro from "./intro";
import Navbar from "./components/navbar";
import SuccessfulAssessment from "./successfulAssessment";

// this is legacy code that was used for the Prolific setup
// it will have to be rewritten for the current setup if we want to include an assessment stage
const checkAssessment = (responses, assessment) => {
  const score = assessment.reduce((acc, claim) => {
    if (responses[claim.id] === claim.reasoning) {
        if (claim.reasoning === "deductive") {
          acc.deductive += 1;
        } else {
          acc.abductive += 1;
      }
    }
    return acc;
    }, {deductive: 0, abductive: 0});
  
  if (score.deductive >= 2 && score.abductive >= 1) return true;
  else return false;
}

export default function Home() {
  const [participant, setParticipant] = useState(""); // Prolific ID
  const [stage, setStage] = useState("id"); // id, loading, intro, assessment, successfulAssessment, annotation and finish
  const [workpackage, setWorkpackage] = useState(""); // Current workpackage
  const [batchId, setBatchId] = useState(""); // Data from Vercel KV
  const [data, setData] = useState(null); // Current data displayed (either assessement of annotation)
  const [assessment, setAssessment] = useState(null); // Assessment data from Vercel KV
  const [annotation, setAnnotation] = useState(null); // Annotation data from Vercel KV
  const [claim, setClaim] = useState(0); // Index of claim
  const [responses, setResponses] = useState({}); // Dict containing responses as claim_id: response
  const [showHelp, setShowHelp] = useState(false); // Display guidelines in a modal
  const [completionCode, setCompletionCode] = useState(""); // Completion code for Prolific

  // Scroll to top when stage or claim changes
  useEffect(() => {
    window.scrollTo({
      top: 0,
      behavior: "smooth", // Optional: Adds a smooth scrolling effect
    });
  }, [stage, claim]); // Scroll to top when stage or claim changes



  useEffect(() => {
    //Fetch data from Vercel KV
    const fetchData = async () => {
      try {
        const response = await fetch("/api/getData", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ participant }),
        });

        // Check for different response statuses
        if (response.status === 204) {
          // Handle 204 No Content
          console.log("No content available.");
          alert("The participant with this ID has already completed the task.");
          setStage("id");
          return;
        } else if (response.status === 404) {
          // Handle 404 Not Found
          console.log("Data not found.");
          alert("The requested data could not be found. Please check if you entered the correct ID.");
          setStage("id");
          return;
        } else if (!response.ok) {
          // Handle other non-successful responses (like 500 Internal Server Error)
          throw new Error(`Unexpected response status: ${response.status}`);
        }
        const result = await response.json();
        setAssessment(result.assessmentClaims);
        setAnnotation(result.claims);
        setBatchId(result.batchId);
        setWorkpackage(result.stage);
        setClaim(result.progress);
        setStage("intro");
      } catch (error) {
        console.error("Error fetching data from Vercel KV:", error);
        alert("Error fetching data from Vercel KV. Please refresh the page.");
        setStage("id");
      }
    };
    if (participant) fetchData();
  }, [participant]);

  // Send responses to Vercel KV database
  const sendResponse = async (annotationResponse) => {
    const currentStage = stage;
    setStage("loading");
    const claimId = data[claim].id;
    const dataLength = data.length;
    const progress = claim + 1;
    try {
      const response = await fetch("/api/saveResponses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ claimId, workpackage, annotationResponse , participant, progress, dataLength }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to save responses");
      }
      if (claim < data.length - 1) {
        setClaim(claim + 1);
        setStage(currentStage);
      }
      else {
        if (currentStage === "annotation") {
          setStage("finish"); // Proceed to the finish stage after annotation
        } else if (currentStage === "assessment") {
          // check if the assessment is successful
          // if successful, proceed to the annotation stage
          // if not, proceed to the finish stage
          if (checkAssessment(responses, assessment)) {
            setStage("successfulAssessment");
          } else {
            setStage("finish");
          }
        }
      }
    } catch (error) {
      setStage(currentStage);
      console.error("Error sending responses to the API:", error);
      alert("Error sending responses. Please try again.");
    }
    
  };

  // Function triggered when "start" button is clicked on the intro page
  const proceedFromID = (id) => {
    setParticipant(id);
    setStage("loading");
  };

  const proceedFromIntro = () => {
    if (assessment.length > 0) {
      setData(assessment);
      setStage("assessment");
    }
    else {
      setData(annotation);
      setStage("annotation");
    }
    
  };

  const proceedFromAssessment = () => {
    setClaim(0);
    setData(annotation);
    setResponses({});
    setStage("annotation");
  };

  // Function to get the next claim during assessment or annotation
  const getNextClaim = (response) => {
    // Save the response
    responses[data[claim].id] = response;
    sendResponse(response);
  };

  // Function to get the current stage page
  const getStagePage = () => {
    if (stage === "id") {
      return (
        <EnterID nextButtonFunction={proceedFromID}/>
      );
    } else if (stage === "loading") {
      return (
        <div className="section">
          <h1 className="title">Loading...</h1>
        </div>
      );
    } else if (stage === "intro") {
      return (
        <Intro
          nextButtonFunction={proceedFromIntro}
          idField={participant}
          batchId={batchId}
          workpackage={workpackage}
        />
      );
    } else if (stage === "successfulAssessment") {
      return (
        <SuccessfulAssessment handleNextButtonClick={proceedFromAssessment} />
      );
    } else if (stage === "annotation" || stage === "assessment") {
      return (
        <AnnotationPanel
          claim={data[claim].claim}
          evidence={data[claim].evidence}
          veracity={data[claim].label}
          nextButtonFunction={getNextClaim}
          progress={`${claim + 1}/${data.length}`}
        />
      );
    } else if (stage === "finish") {
      return (
        <div className="section">
          <h1 className="title">Thank you for annotating the data!</h1>
          <p className="mt-4">
            You have completed <span className="is-capitalized has-text-weight-bold">{workpackage}</span>. Please contact one of the researchers for the next steps.
            <br />
            <br />
          </p>
        </div>
      );
    }
  };

  return (
    <>
      <Head>
        <title>NLP data annotation</title>
        <meta name="description" content="Generated by create next app" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Navbar clickOnHelp={() => setShowHelp(true)} />

      <div className={`modal ${showHelp ? "is-active" : ""}`}>
        <div
          className="modal-background"
          onClick={() => setShowHelp(false)}
        ></div>
        <div className="modal-content">
          <div className="box">
            <Guidelines batchId={batchId} />
          </div>
        </div>
        <button
          className="modal-close is-large has-text-weight-bold"
          aria-label="close"
          onClick={() => setShowHelp(false)}
        >
          X
        </button>
      </div>

      <main>{getStagePage()}</main>
    </>
  );
}
