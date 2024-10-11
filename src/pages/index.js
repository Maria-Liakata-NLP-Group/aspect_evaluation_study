import { useState, useEffect} from "react";
import { useRouter } from "next/router";
import AnnotationPanel from "./annotation";
import Guidelines from "./components/guidelines";
import Head from "next/head";
import Intro from "./intro";
import Navbar from "./components/navbar";
import SuccessfulAssessment from "./successfulAssessment";


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
  const router = useRouter();
  const [participant, setParticipant] = useState(""); // Prolific ID
  const [stage, setStage] = useState("loading"); // loading, intro, assessment, successfulAssessment, annotation or finish
  const [batchId, setBatchId] = useState(""); // Data from Vercel KV
  const [data, setData] = useState(null); // Current data displayed (either assessement of annotation)
  const [assessment, setAssessment] = useState(null); // Assessment data from Vercel KV
  const [annotation, setAnnotation] = useState(null); // Annotation data from Vercel KV
  const [claim, setClaim] = useState(0); // Index of claim
  const [responses, setResponses] = useState({}); // Dict containing responses as claim_id: response
  const [showHelp, setShowHelp] = useState(false); // Display guidelines in a modal
  const [completionCode, setCompletionCode] = useState(""); // Completion code for Prolific

  // Function exectued when app is fist loaded
  useEffect(() => {
    //Fetch data from Vercel KV
    const fetchData = async () => {
      try {
        const response = await fetch("/api/getData");
        const result = await response.json();
        setAssessment(result.assessmentClaims);
        setAnnotation(result.claims);
        setBatchId(result.batchId);
        setStage("intro");
      } catch (error) {
        console.error("Error fetching data from Vercel KV:", error);
        alert("Error fetching data from Vercel KV. Please refresh the page.");
      }
    };
    fetchData();
  }, []);

  // Function executed when router changed
  useEffect(() => {
    if (router.isReady) {
      const { PROLIFIC_PID, STUDY_ID, SESSION_ID } = router.query;

      // Set Prolific ID, Study ID, and Session ID from query parameters
      if (PROLIFIC_PID) {
        setParticipant(PROLIFIC_PID);
      }
    }
  }, [router.isReady, router.query]);

  // Scroll to top when stage or claim changes
  useEffect(() => {
    window.scrollTo({
      top: 0,
      behavior: "smooth", // Optional: Adds a smooth scrolling effect
    });
  }, [stage, claim]); // Scroll to top when stage or claim changes

  // Readd batchID to queue if user fails assessment
  const readdBatchToQueue = async () => {
    try {
      const response = await fetch("/api/addToQueue", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ batchId }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to readd batch to queue");
      }
    } catch (error) {
      console.error("Error readding batch to queue:", error);
      alert("Error readding batch to queue. Please try again.");
    }
  };

  // Send responses to Vercel KV database
  const sendResponses = async (responses, participant, batchId) => {
    try {
      const response = await fetch("/api/saveResponses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ participant, responses, batchId, stage}),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to save responses");
      }

      if (stage === "annotation") {
        setStage("finish"); // Proceed to the finish stage after annotation
      } 
      else if (stage === "assessment") {
        // check if the assessment is successful
        // if successful, proceed to the annotation stage
        // if not, proceed to the finish stage
        if (checkAssessment(responses, assessment)) {
            setCompletionCode(process.env.NEXT_PUBLIC_PROLIFIC_SUCCESS);
            setStage("successfulAssessment");
        } else {
            readdBatchToQueue();
            setCompletionCode(process.env.NEXT_PUBLIC_PROLIFIC_FAIL);
            setStage("finish");
        }

      }
    } catch (error) {
      console.error("Error sending responses to the API:", error);
      setStage("annotation"); // Go back to annotation stage if there's an error
      alert("Error sending responses. Please try again.");
    }
  };

  // Function triggered when "start" button is clicked on the intro page
  const proceedFromIntro = (id) => {
    setParticipant(id);
    setData(assessment);
    setStage("assessment");
  };

  const proceedFromAssessment = () => {
      setClaim(0);
      setData(annotation);
      setResponses({});
      setStage("annotation");
  }

  // Function to get the next claim during assessment or annotation
  const getNextClaim = (response) => {
    // Save the response
    responses[data[claim].id] = response;
    setResponses(responses);
    if (claim < data.length - 1) {
      setClaim(claim + 1);
    } else {
      setStage("loading");
      sendResponses(responses, participant, batchId);
    }
  };

  // Function to get the current stage page
  const getStagePage = () => {
    if (stage === "loading") {
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
            You can now return to Prolific and submit your completion code.
            <br />
            <br />
            <b>Completion code: </b>
            <span className="tag">{completionCode}</span>
            <br />
            or use this link{" "}
            <a href={`https://app.prolific.com/submissions/complete?cc=${completionCode}`}>
              {`https://app.prolific.com/submissions/complete?cc=${completionCode}`}
            </a>
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

      <main>
        {getStagePage()}
      </main>
    </>
  );
}
