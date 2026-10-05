function getStageStatusDetails(status) {
  if (status === 'success') {
    return {
      icon: '✓',
      label: 'Passed',
    }
  }

  if (status === 'warning') {
    return {
      icon: '!',
      label: 'Warning',
    }
  }

  return {
    icon: '×',
    label: 'Failed',
  }
}

function PipelineSummary({ stages = [] }) {
  const successfulStages = stages.filter(
    (stage) => stage.status === 'success'
  ).length

  const warningStages = stages.filter(
    (stage) => stage.status === 'warning'
  ).length

  const failedStages = stages.filter(
    (stage) => stage.status === 'error'
  ).length

  return (
    <section className="section">
      <article className="card vision-pipeline-summary">
        <div className="vision-summary-heading">
          <div>
            <p className="eyebrow">Pipeline health</p>
            <h2>Analysis Summary</h2>

            <p>
              Review the status of every screenshot-recognition
              stage.
            </p>
          </div>

          <div className="vision-summary-counts">
            <span className="summary-count success">
              {successfulStages} passed
            </span>

            <span className="summary-count warning">
              {warningStages} warning
              {warningStages === 1 ? '' : 's'}
            </span>

            <span className="summary-count error">
              {failedStages} failed
            </span>
          </div>
        </div>

        <div className="vision-pipeline-stages">
          {stages.map((stage) => {
            const statusDetails = getStageStatusDetails(
              stage.status
            )

            return (
              <div
                className={`vision-pipeline-stage ${stage.status}`}
                key={stage.id}
              >
                <div
                  className={`pipeline-stage-icon ${stage.status}`}
                >
                  {statusDetails.icon}
                </div>

                <div className="pipeline-stage-content">
                  <div className="pipeline-stage-title">
                    <strong>{stage.title}</strong>

                    <span
                      className={`pipeline-stage-status ${stage.status}`}
                    >
                      {statusDetails.label}
                    </span>
                  </div>

                  <p>{stage.message}</p>
                </div>
              </div>
            )
          })}
        </div>
      </article>
    </section>
  )
}

export default PipelineSummary