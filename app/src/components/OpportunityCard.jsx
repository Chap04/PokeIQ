function OpportunityCard({ opportunity }) {
  return (
    <article className="card opportunity-card">
      <h3>{opportunity.title}</h3>
      <p>{opportunity.description}</p>
    </article>
  )
}

export default OpportunityCard