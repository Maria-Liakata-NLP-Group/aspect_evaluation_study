import React, { Fragment } from "react";
import Image from "next/image";

const getExampleLayout = (example) => {
  const { title, ...items } = example;

  return (
    <>
      <u>
        <b className="is-capitalized">{title}</b>
      </u>
      <br />
      <ul>
        {Object.keys(items).map((key) => {
          return (
            <li key={key}>
              <b className="is-capitalized">{key}:</b> {items[key]}
            </li>
          );
        })}
      </ul>
    </>
  );
};

const generateGuidelines = (
  annotation_examples,
  definitions,
  definition_examples,
  difference_definition,
  difference_table
) => {
  return (
    <>
      <h2 className="subtitle mb-3">Annotation Examples</h2>
      {annotation_examples.map((example, index) => {
        return (
          <div key={`${example}_${index}`}>
            {getExampleLayout(example)}
            {index < annotation_examples.length - 1 && <hr />}
          </div>
        );
      })}

      <h2 className="subtitle mt-5 mb-3">Reasoning Types</h2>

      {Object.keys(definitions).map((key) => {
        return (
          <Fragment key={key}>
            <div className="mt-5 mb-3">
              <u className="mb-3">
                <b className="is-capitalized">{key} Reasoning</b>
              </u>
            </div>
            <p className="mb-3">
              <b>Definition: </b> {definitions[key]}
            </p>
            {definition_examples[key].map((example, index) => {
              return (
                <div key={`${example}_${index}`}>
                  {getExampleLayout(example)}
                  {index < definition_examples.deductive.length - 1 && <hr />}
                </div>
              );
            })}
          </Fragment>
        );
      })}

      <h2 className="subtitle mt-5 mb-3">
        Differences between Deductive and Abductive
      </h2>
      <p className="mb-3">{difference_definition}</p>
      <div className="table-container">
        <table className="table is-bordered is-striped is-fullwidth">
          <thead>
            <tr>
              <th>Deductive Reasoning</th>
              <th>Abductive Reasoning</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colSpan="2"></td>
            </tr>
            {difference_table.map((section, i) => {
              return (
                <Fragment key={`table_${i}`}>
                  {section.map((row, j) => {
                    return (
                      <tr key={`${row.itemName}_${j}`}>
                        <td>
                          <b className="is-capitalized">{row.itemName}:</b>{" "}
                          {row.deductive}
                        </td>
                        <td>
                          <b className="is-capitalized">{row.itemName}:</b>{" "}
                          {row.abductive}
                        </td>
                      </tr>
                    );
                  })}
                  {i < difference_table.length - 1 && (
                    <tr>
                      <td colSpan="2"></td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
};

const vitC = generateGuidelines(
  [
    {
      title: "Example 1",
      claim:
        "It is believed that the COVID-19 virus spreads mostly through coughing.",
      evidence:
        "The virus is believed to spread between people primarily via respiratory droplets produced during coughing.",
      label: "Supports",
      reasoning: "Deductive",
      comment:
        "We deduce the reasoning behind spreading of covid through coughing. We know from the evidence that COVID-19 is spread through respiratory droplets produced through coughing which directly deduces that COVID-19 is indeed spread through coughing.",
    },
    {
      title: "Example 2",
      claim: "London's congestion charge is under 10 pounds.",
      evidence:
        "In central London, these vehicles are also exempt from the £11.5 daily London congestion charge.",
      label: "Refutes",
      reasoning: "Deductive",
      comment:
        "We deduce through numerical comparison. We know from the evidence that the congestion charge is £11.5 > £10 and therefore the claim is refuted through negative deduction.",
    },
    {
      title: "Example 3",
      claim:
        "The most prominent smartphone vendor in the world was BlackBerry.",
      evidence:
        "BlackBerry was one of the most prominent smartphone vendors in the world, specializing in secure communications and mobile productivity, and well-known for the keyboards on most of its devices.",
      label: "Supports",
      reasoning: "Abductive",
      comment:
        "Here, we can hypothesize that as BlackBerry was one of most prominent smartphone vendors in the world, it likely was at some point in time the most prominent among all the vendors. Hence, the evidence abductively supports the claim.",
    },
    {
      title: "Example 4",
      claim: "Civilization IV is a board game.",
      evidence:
        "The game has received critical acclaim and was hailed as an exemplary product of one of the leading video game producers in the turn-based strategy genre.",
      label: "Refutes",
      reasoning: "Abductive",
      comment:
        "We abductively refute this as the game was developed by a video game development company and it is unlikely for them to develop a board game as it is mentioned the game is a turn based strategy game.",
    },
  ],
  {
    deductive:
      "a logical reasoning mode by which a conclusion is drawn from a set of premises. The conclusion is valid if it reasonably follows the associated premises. Thus, if the premise holds, then the conclusion also holds.",
    abductive:
      "The logical reasoning mode by which the most plausible conclusion is drawn from a set of hypotheses that are based upon partial observations/evidence. In simple terms, abductive reasoning is a best guess given some evidence that doesn’t account for every possibility. This means abductive reasoning can also lead to false conclusions.",
  },
  {
    deductive: [
      {
        title: "Example 1",
        claim: "If it is raining, then there are clouds in the sky.",
        evidence: "There are no clouds in the sky.",
        comment: "Thus, it is not raining.",
      },
      {
        title: "Example 2",
        claim: "If there had been a thunderstorm, it would have rained.",
        evidence: "If it had rained, things would have gotten wet.",
        comment:
          "Thus, if there had been a thunderstorm, things would have gotten wet.",
      },
    ],
    abductive: [
      {
        title: "Example 1",
        observation1: "The grass in the garden is wet",
        observation2: "It is currently the peak summer season.",
        evidence:
          "There are water droplets on the leaves, and the ground is damp.",
        hypothesis1: "It rained last night",
        hypothesis2: "It dewed last night.",
        comment:
          "Dew doesn’t fall during peak summer. Therefore, the wet grass is most likely due to rain.",
      },
    ],
  },
  "Deduction comes to a conclusion based on a set of evidence and premise. By comparison, Abduction creates different hypotheses based on evidence/premise pairs and comes to a conclusion based on the most likely hypothesis. Table below provides examples.",
  [
    [
      {
        itemName: "Claim",
        deductive: "These beans are from this bag.",
        abductive: "These beans are [oddly] white.",
      },
      {
        itemName: "Evidence",
        deductive: "All the beans from this bag are white.",
        abductive: "All the beans from this bag are white.",
      },
      {
        itemName: "Comment",
        deductive: "Therefore, these beans are white.",
        abductive: "Therefore, these beans are from this bag.",
      },
    ],
    [
      {
        itemName: "Claim",
        deductive: "Jahron Anthony Brathwaite was born before 1960.",
        abductive:
          "The most prominent smartphone vendor in the world was BlackBerry.",
      },
      {
        itemName: "Evidence",
        deductive:
          "Jahron Anthony Brathwaite ( born July 3 , 1993 ) , known professionally as PartyNextDoor ( stylized in all caps ) , is a Canadian singer-songwriter , rapper and record producer.",
        abductive:
          "BlackBerry was one of the most prominent smartphone vendors in the world , specializing in secure communications and mobile productivity, and well-known for the keyboards on most of its devices .",
      },
      {
        itemName: "Label",
        deductive: "Refutes",
        abductive: "Supports",
      },
      {
        itemName: "Comment",
        deductive:
          "Here, we can easily see that the birth year in the evidence is much later than the birth year in the claim. Hence, the evidence refutes the claim deductively. ",
        abductive:
          "Here, we can hypothesize that as BlackBerry was one of most prominent smartphone vendors in the world, it likely was at some point in time the most prominent among all the vendors. Hence, the evidence abductively supports the claim.",
      },
    ],
  ]
);

const climateFever = generateGuidelines(
  [
    {
      title: "Example 1",
      claim: "Climate change isn't increasing extreme weather damage costs.",
      evidence:
        '1. Many analyses, such as that of the Stern Review presented to the British Government, have predicted reductions by several percent of world gross domestic product due to climate related costs such as dealing with increased extreme weather events and stresses to low-lying areas due to sea level rises. 2. Global losses reveal rapidly rising costs due to extreme weather-related events since the 1970s. 3. Global warming boosts the probability of extreme weather events, like heat waves, far more than it boosts more moderate events. 4. "Impacts [of climate change] will very likely increase due to increased frequencies and intensities of some extreme weather events".',
      label: "Refutes",
      reasoning: "Deductive",
      comment:
        "The evidence deductively refutes the claim. We find explicit mention of increased damage cost in the second line of the evidence. While the last two lines of evidence provide explicit evidence of global causing more adverse weather events.",
    },
    {
      title: "Example 2",
      claim:
        "Pluto's climate change over the last 14 years is likely a seasonal event.",
      evidence: `1. The long orbital period of Neptune results in seasons lasting forty years. 2. As a result, Neptune experiences similar seasonal changes to Earth. 3. "Evidence for methane escape and strong seasonal and dynamical perturbations of Neptune's atmospheric temperatures". 4. Each planet therefore has seasons, changes to the climate over the course of its year.`,
      label: "Supportes",
      reasoning: "Abductive",
      comment:
        "The claim is abductively supported. Given Pluto used to be a planet and now is labeled as a dwarf planet, we can hypothesize that it likely has the same attribute as neptune. Given pluto has the biggest orbital period, it is very much likely pluto seasons last over 10 years.",
    },
  ],
  {
    deductive:
      "a logical reasoning mode by which a conclusion is drawn from a set of premises. The conclusion is valid if it reasonably follows the associated premises. Thus, if the premise holds, then the conclusion also holds.",
    abductive:
      "the logical reasoning mode by which the most plausible conclusion is drawn from a set of hypotheses that are based upon partial observations/evidence. In simple terms, abductive reasoning is a best guess given some evidence that doesn’t account for every possibility. This means abductive reasoning can also lead to false conclusions.",
  },
  {
    deductive: [
      {
        title: "Example 1",
        claim:
          "Scientists have known for some time, from multiple lines of evidence, that humans are changing Earth's climate, primarily through greenhouse gas emissions.",
        evidence: `1. In the scientific literature, there is an overwhelming consensus that global surface temperatures have increased in recent decades and that the trend is caused mainly by human-induced emissions of greenhouse gasses. 2. Scientists have determined that the major factors causing the current climate change are greenhouse gasses, land use changes, and aerosols and soot. 3. The Intergovernmental Panel on Climate Change said the likelihood was 90 percent to 99 percent that emissions of heat-trapping greenhouse gasses like carbon dioxide, spewed from tailpipes and smokestacks, were the dominant cause of the observed warming of the last 50 years. 4. The global warming observed over the past 50 years is due primarily to human-induced emissions of heat-trapping gasses. 5. Human activities, primarily the burning of fossil fuels (coal, oil, and natural gas), and secondarily the clearing of land, have increased the concentration of carbon dioxide, methane, and other heat-trapping ("greenhouse") gasses in the atmosphere...There is international scientific consensus that most of the warming observed over the last 50 years is attributable to human activities.`,
        label: "Supports",
        reasoning: "Deductive",
        comment:
          "The claim is deductively supported. We can find explicit evidence for support in the lines 1, 4 and 5.",
      },
      {
        title: "Example 2",
        claim:
          "Despite recent attempts to paint the United States as a major global polluter, according to the World Health Organization (WHO), the U.S. is among the cleanest nations on the planet.",
        evidence:
          "1. The most prominent is the Environmental Protection Agency (EPA), created by presidential order in 1970. 2. It is the only country in the world, other than Eritrea, to do so. 3. Since 2007, the total greenhouse gas emissions by the United States are the second highest by country, exceeded only by China. 4. The United States has historically been the world's largest producer of greenhouse gasses and greenhouse gas emissions per capita remain high. 5. Issues that affect water supply in the United States include droughts in the West, water scarcity, pollution, a backlog of investment, concerns about the affordability of water for the poorest, and a rapidly retiring workforce.",
        label: "Refutes",
        reasoning: "Deductive",
        comment:
          "The claim is deductively refuted. As per evidence (line 3) USA is the second highest greenhouse emitter in the world and it has the largest per capita emission in the world (line 4).",
      },
    ],
    abductive: [
      {
        title: "Example 1",
        claim: `Unprecedented climate change has caused sea level at Sydney Harbour to rise approximately 0.0 cm over the past 140 years.`,
        evidence:
          "1. Between 1993 and 2017, the global mean sea level rose on average by 3.1 ± 0.3 mm per year, with an acceleration detected as well. 2. Over the 21st century, the IPCC projects that in a very high emissions scenario the sea level could rise by 61–110 cm. 3. Between 1900 and 2016, the sea level rose by 16–21 cm (6.3–8.3 in). 4. 18 January 2019. 5. For at least the last 100 years, sea level has been rising at an average rate of about 1.8 mm (0.07 in) per year.",
        label: "Refutes",
        comment:
          "The claim is abductively refuted. This evidence only talks about global sea level. However, given the evidence on global sea level it is more than likely that the sea level at Sydney Harbour increased over the past 140 years.",
      },
    ],
  },
  "Deduction is the process of inferring a conclusion regarding a premise given some evidence. This conclusion can be usually inferred directly from the evidence. By comparison, Abduction creates different hypotheses based on evidence/premise pairs and comes to a conclusion based on the most likely hypothesis. Table below provides examples.",
  [
    [
      {
        itemName: "Claim",
        deductive: "Increasing CO2 in the atmosphere has little to no effect.",
        abductive:
          "Hurricane Harvey gave Houston and the surrounding region a $125 billion lesson about the costs of misjudging the potential for floods",
      },
      {
        itemName: "Evidence",
        deductive:
          "1. Increases in atmospheric concentrations of CO 2 and other long-lived greenhouse gasses such as methane, nitrous oxide and ozone have correspondingly strengthened their absorption and emission of infrared radiation, causing the rise in average global temperature since the mid-20th century. 2. Higher atmospheric CO2 concentrations have led to an increase in dissolved CO2, which causes ocean acidification. 3. Increased concentrations of gasses such as CO 2 (~20%), ozone and N 2O are external forcing on the other hand.",
        abductive: `1. "Hurricane Harvey was year's costliest U.S. disaster at $125 billion in damages". 2. The damage for the Houston area is estimated at up to $125 billion U.S. dollars, and it is considered to be one of the worst natural disasters in the history of the United States, with the death toll exceeding 70 people. 3. It is tied with 2005's Hurricane Katrina as the costliest tropical cyclone on record, inflicting $125 billion (2017 USD) in damage, primarily from catastrophic rainfall-triggered flooding in the Houston metropolitan area and Southeast Texas. 4. Preliminary reporting from the National Oceanic and Atmospheric Administration set a more concrete total at $125 billion, making Harvey the 2nd costliest tropical cyclone on record, behind Hurricane Katrina with 2017 costs of $161 billion (after adjusting for inflation). 5. The National Oceanic and Atmospheric Administration estimated total damage at $125 billion, with a 90% confidence interval of $90–160 billion.`,
      },
      {
        itemName: "Label",
        deductive: "Refutes",
        abductive: "Supports",
      },
      {
        itemName: "Comment",
        deductive:
          "The first line of evidence provides counterexamples for the claims and disapproves it. Hence, the claim is deductively refuted.",
        abductive:
          "The evidence only substantiates the cost part of the claim. However, given the reports of flooding and lost life, we can hypothesize that the government indeed did not prepare for flooding properly. Hence, the claim is supported by the evidence abductively.   ",
      },
    ],
  ]
);

const phemeplus = generateGuidelines(
  [
    {
      title: "Example 1",
      claim:
        "Schools closed, Dammartin-en-Goele residents told to stay indoors, town ‘like warzone",
      evidence:
        "Schools went into lockdown and the town appealed to residents to stay inside resident’s houses.",
      label: "True",
      reasoning: "Deductive",
      comment:
        "The evidence explicitly references the school closing down and also residents being told to shelter at home. Therefore, we deductively come to the conclusion that the rumour veracity is true.",
    },
    {
      title: "Example 2",
      claim:
        "SYDNEY SIEGE : Gunman forces hostages to hold up ISIS flag in window",
      evidence:
        "A gunman overran the Lindt Cafe in Sydney Sunday night and reportedly forced hostages to display a black flag with what appeared to be the shahada, the Muslim creed, in white.",
      label: "False",
      reasoning: "Deductive",
      comment:
        "we deduce that the evidence does not support the claim because the claim states “ISIS flag” whereas the evidence says it was a flag associated with the Muslim creed.",
    },
  ],
  {
    deductive:
      "a logical reasoning mode by which a conclusion is drawn from a set of premises. The conclusion is valid if it reasonably follows the associated premises. Thus, if the premise holds, then the conclusion also holds.",
    abductive:
      "the logical reasoning mode by which the most plausible conclusion is drawn from a set of hypotheses that are based upon partial observations/evidence. In simple terms, abductive reasoning is a best guess given some evidence that doesn’t account for every possibility. This means abductive reasoning can also lead to false conclusions.",
  },
  {
    deductive: [
      {
        title: "Example 1",
        claim:
          "Australian TV pictures show police storming cafe under siege in Sydney",
        evidence:
          "Two people died, along with an Islamist gunman, after commandos stormed a cafe in Sydney, Australia, to bring to an end a 16-hour siege.",
        comment:
          "We can deduce that “police” in the claim and “commandos” in the evidence are the same entity and hence the veracity of the claim is considered to be true. ",
      },
      {
        title: "Example 2",
        claim:
          "BREAKING Germanwings 4U9525 co-pilot's name is Andreas Lubitz , a German national , says Marseilles prosecutor .",
        evidence:
          "The co-pilot of the Germanwings Airbus A320 that crashed in the French Alps has been named by French authorities as German national Andreas Lubitz.",
        comment:
          "We can deduce the veracity as true due to the evidence explicitly mentioning the pilots name. ",
      },
    ],
    abductive: [
      {
        title: "Example 1",
        claim:
          "UPDATE : There are reports police have discovered the identity of the lone gunman , with the SydneySiege in its sixth hour . 9News",
        evidence:
          "Police are negotiating with a gunman who is holding a number of people inside a central Sydney cafe, hours after five hostages ran from a central Sydney cafe.",
        label: "True",
        comment:
          "The claim is abductively true. Here, we need to come up with the hypothesis that the police may have discovered the gunman's identity during the negotiation process.",
      },
    ],
  },
  "Deduction is the process of inferring a conclusion regarding a premise given some evidence. This conclusion can be usually inferred directly from the evidence. By comparison, Abduction creates different hypotheses based on evidence/premise pairs and comes to a conclusion based on the most likely hypothesis. Table below provides examples. ",
  [
    [
      {
        itemName: "Claim",
        deductive:
          "Ottawa police confirm 1 male shooting suspect died ; no one in custody - @OttawaPolice",
        abductive:
          "Recovered black box shows a pilot was locked out of the Germanwings cockpit before the crash",
      },
      {
        itemName: "Evidence",
        deductive:
          "Ottawa Police say ' a male suspect has been confirmed deceased, ' but it's unclear how a male suspect died or if a male suspect died at the Parliament building.",
        abductive:
          "The official described hearing one of the pilots the cockpit lightly knocked on the door at first - before pounding on the door.",
      },
      {
        itemName: "Label",
        deductive: "true",
        abductive: "true",
      },
      {
        itemName: "Comment",
        deductive:
          " Here we can deduce through direct comparison between claim and evidence that the claim is true. The police indeed confirm a deceased man.",
        abductive:
          "This claim is abductively true. The reason is, we need to hypothesize from the pounding on the door part, that the pilot was indeed locked out of the cockpit. ",
      },
    ],
  ]
);

const getGuidelines = (batchId) => {
  if (batchId?.includes("vitc")) return vitC;
  else if (batchId?.includes("cl")) return climateFever;
  else if (batchId?.includes("ph")) return phemeplus;
  else return <></>;
};

const Guidelines = ({ batchId }) => {
  return (
    <>
      <h2 className="subtitle">Guidelines</h2>
      <p className="mt-3">
        <u>
          <b>Objective</b>
        </u>
        <br />
        The goal is to identify what type of reasoning is necessary to infer the
        veracity label (
        {batchId?.includes("ph") ? "True/False" : "Supports/Refutes"}) of a
        claim given associated evidence, for a set of claim-evidence-veracity
        triples.
      </p>
      <p className="mt-3">
        <u>
          <b>Task Description</b>
        </u>
        <br />
        You will be given a set of <b>claim</b>, <b>evidence</b>, <b>labels</b>,
        where the label refers to the ground truth (
        {batchId?.includes("ph") ? "True/False" : "Supports/Refutes"}) of a
        given claim. The following figure shows the process.
      </p>
      <div className="pl-5 pr-5">
        <Image
          src="/images/guidelines_flowchart.png"
          alt="Guidelines"
          layout="responsive"
          width={707}
          height={375}
          className="mt-3"
        />
      </div>
      <p className="mt-3">
        Read the claim and its associated evidence. Afterwards see the labels
        and then decide/choose the reasoning type you think was necessary for
        coming to that label. The reasoning types are <b>abductive</b> and{" "}
        <b>deductive</b>.
      </p>
      <div className="mt-3">{getGuidelines(batchId)}</div>
    </>
  );
};

export default Guidelines;
