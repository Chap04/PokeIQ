import {
  useEffect,
  useMemo,
} from 'react'

import RecommendationCard from '../components/RecommendationCard'

import {
  buildRaidDashboard,
} from '../services/buildRaidDashboard'

import {
  buildRaidTypeProfile,
} from '../services/buildRaidTypeProfile'

import {
  enrichRaidRecommendationsWithAccountImpact,
} from '../services/enrichRaidRecommendationsWithAccountImpact'

import {
  evaluateResourceActionability,
} from '../utils/resourceActionability'

import {
  recommendationHasProject,
} from '../utils/projectMatching.js'

import {
  rankRaidRecommendationsByAccountImpact,
} from '../services/rankRaidRecommendationsByAccountImpact'

import {
  evaluateRareCandyOpportunityCost,
} from '../services/evaluateRareCandyOpportunityCost'

// --------------------------------------------------
// Resource actionability
// --------------------------------------------------

function addResourceActionability(
  recommendation,
  playerResources,
  candyFamilyBalances
) {
  if (!recommendation) {
    return recommendation
  }

  return {
    ...recommendation,

    resourceActionability:
      evaluateResourceActionability(
        recommendation.resourceRequirements,
        playerResources,
        candyFamilyBalances
      ),
  }
}

// --------------------------------------------------
// Type-profile debug
// --------------------------------------------------

function buildTypeTeamDebugRows(
  typeTeam
) {
  return (
    typeTeam?.team ??
    []
  ).map(
    member => ({
      Rank:
        member.typeRank,

      Pokémon:
        member.pokemonName,

      CP:
        member.cp,

      Level:
        member.level,

      Strength:
        member.strengthScore,

      Absolute:
        member.absoluteStrengthScore,

      Fast:
        member
          .bestCurrentLoadout
          ?.fastMoveId ??
        '—',

      Charged:
        member
          .bestCurrentLoadout
          ?.chargedMoveId ??
        '—',

      Matchups:
        member.relevantMatchupCount,
    })
  )
}

// --------------------------------------------------
// Account-impact debug formatting
// --------------------------------------------------

function formatSigned(
  value,
  decimals = 2
) {
  if (
    !Number.isFinite(
      value
    )
  ) {
    return '—'
  }

  const formatted =
    value.toFixed(
      decimals
    )

  return value > 0
    ? `+${formatted}`
    : formatted
}

function formatSignedPercent(
  value
) {
  if (
    !Number.isFinite(
      value
    )
  ) {
    return '—'
  }

  return `${formatSigned(
    value,
    2
  )}%`
}

function getRecommendationName(
  recommendation
) {
  return (
    recommendation
      ?.pokemonName ??
    recommendation
      ?.pokemon
      ?.name ??
    recommendation
      ?.artwork
      ?.name ??
    'Unknown'
  )
}

function getRecommendationTitle(
  recommendation
) {
  return (
    recommendation
      ?.title ??
    'Raid Investment'
  )
}

// --------------------------------------------------
// Account-impact debug rows
// --------------------------------------------------

function buildRecommendationImpactDebugRows(
  recommendations
) {
  return (
    recommendations ??
    []
  ).map(
    (
      recommendation,
      index
    ) => {
      const summary =
        recommendation
          ?.accountImpactSummary

      const biggest =
        summary
          ?.biggestImprovement

      return {
        Order:
          index + 1,

        Pokémon:
          getRecommendationName(
            recommendation
          ),

        Recommendation:
          getRecommendationTitle(
            recommendation
          ),

        Status:
          recommendation
            ?.accountImpactStatus ??
          '—',

        'Overall Change':
          formatSigned(
            summary
              ?.overallStrengthPointChange
          ),

        'Overall %':
          formatSignedPercent(
            summary
              ?.overallStrengthPercentChange
          ),

        'Affected Types':
          summary
            ?.affectedTypeCount ??
          '—',

        'Improved Types':
          summary
            ?.improvedTypeCount ??
          '—',

        'Regressed Types':
          summary
            ?.regressedTypeCount ??
          '—',

        'Biggest Gain':
          biggest
            ? (
                `${biggest.type} ` +
                `${formatSignedPercent(
                  biggest.percentChange
                )}`
              )
            : '—',

        'Team Changed':
          summary
            ?.changesCurrentTypeTeam
            ? 'Yes'
            : 'No',

        'New Coverage':
          summary
            ?.createsNewTypeCoverage
            ? 'Yes'
            : 'No',
      }
    }
  )
}

// --------------------------------------------------
// Rare Candy debug rows
// --------------------------------------------------

function buildRareCandyDebugRows(
  opportunities
) {
  return (
    opportunities ??
    []
  ).map(
    opportunity => ({
      Rank:
        opportunity
          .sharedResourceRank ??
        '—',

      Pokémon:
        opportunity
          .pokemonName ??
        'Unknown',

      Recommendation:
        opportunity
          .recommendationTitle ??
        'Raid Investment',

      Resource:
        opportunity
          .sharedResourceLabel ??
        opportunity
          .sharedResource ??
        '—',

      'Candy Family':
        opportunity
          .candyFamilyName ??
        opportunity
          .candyFamilyId ??
        '—',

      'Family Owned':
        opportunity
          .candyOwned ??
        '—',

      'Family Required':
        opportunity
          .candyRequired ??
        '—',

      Shortfall:
        opportunity
          .candyMissing ??
        '—',

      'Shared Owned':
        opportunity
          ?.coverage
          ?.owned ??
        '—',

      'Can Cover':
        opportunity
          ?.coverage
          ?.canFullyCover ===
        true
          ? 'Yes'
          : (
              opportunity
                ?.coverage
                ?.canFullyCover ===
              false
                ? 'No'
                : 'Unknown'
            ),

      'Remaining After':
        opportunity
          ?.coverage
          ?.remainingAfterSpend ??
        '—',

      'Account Change':
        formatSigned(
          opportunity
            ?.accountImpact
            ?.pointChange
        ),

      'Account %':
        formatSignedPercent(
          opportunity
            ?.accountImpact
            ?.percentChange
        ),

      'Value / Candy':
        Number.isFinite(
          opportunity
            ?.valuePerSharedCandy
        )
          ? opportunity
              .valuePerSharedCandy
              .toFixed(4)
          : '—',

      Frontier:
        opportunity
          .frontier
          ? 'Yes'
          : 'No',

      'Dominated By':
        opportunity
          .dominatedByCount ??
        0,

      Decision:
        opportunity
          ?.recommendation
          ?.label ??
        '—',
    })
  )
}

// --------------------------------------------------
// Dashboard
// --------------------------------------------------

function Dashboard({
  pokemonCollection,
  playerResources,
  candyFamilyBalances,
  projects = [],
  onAddProject,
  onUpdateCandyFamilyBalance,
}) {
  const baseRaidDashboard =
    useMemo(
      () =>
        buildRaidDashboard(
          pokemonCollection
        ),
      [
        pokemonCollection,
      ]
    )

  const raidTypeProfile =
    useMemo(
      () =>
        buildRaidTypeProfile(
          pokemonCollection
        ),
      [
        pokemonCollection,
      ]
    )

  const actionableImpactBatch =
    useMemo(
      () =>
        enrichRaidRecommendationsWithAccountImpact({
          recommendations:
            baseRaidDashboard
              .recommendations ??
            [],

          currentProfile:
            raidTypeProfile,
        }),
      [
        baseRaidDashboard,
        raidTypeProfile,
      ]
    )

  const accountAwareRanking =
    useMemo(
      () =>
        rankRaidRecommendationsByAccountImpact(
          actionableImpactBatch
            .recommendations ??
          []
        ),
      [
        actionableImpactBatch,
      ]
    )

  const evolutionImpactBatch =
    useMemo(
      () =>
        enrichRaidRecommendationsWithAccountImpact({
          recommendations:
            baseRaidDashboard
              .potentialEvolutionInvestments ??
            [],

          currentProfile:
            raidTypeProfile,
        }),
      [
        baseRaidDashboard,
        raidTypeProfile,
      ]
    )

  const resourceAwareRecommendations =
    useMemo(
      () =>
        (
          accountAwareRanking
            .recommendations ??
          []
        ).map(
          recommendation =>
            addResourceActionability(
              recommendation,
              playerResources,
              candyFamilyBalances
            )
        ),
      [
        accountAwareRanking,
        playerResources,
        candyFamilyBalances,
      ]
    )

  const rareCandyIntelligence =
    useMemo(
      () =>
        evaluateRareCandyOpportunityCost(
          resourceAwareRecommendations
        ),
      [
        resourceAwareRecommendations,
      ]
    )

  const resourceAwarePotentialEvolutions =
    useMemo(
      () =>
        (
          evolutionImpactBatch
            .recommendations ??
          []
        ).map(
          recommendation =>
            addResourceActionability(
              recommendation,
              playerResources,
              candyFamilyBalances
            )
        ),
      [
        evolutionImpactBatch,
        playerResources,
        candyFamilyBalances,
      ]
    )

  const raidDashboard =
    useMemo(
      () => {
        const recommendations =
          rareCandyIntelligence
            ?.recommendations ??
          resourceAwareRecommendations

        return {
          ...baseRaidDashboard,

          recommendations,

          potentialEvolutionInvestments:
            resourceAwarePotentialEvolutions,

          accountImpact: {
            actionable:
              actionableImpactBatch,

            ranking:
              accountAwareRanking,

            potentialEvolution:
              evolutionImpactBatch,
          },

          rareCandyIntelligence,
        }
      },
      [
        baseRaidDashboard,
        actionableImpactBatch,
        accountAwareRanking,
        evolutionImpactBatch,
        resourceAwareRecommendations,
        resourceAwarePotentialEvolutions,
        rareCandyIntelligence,
      ]
    )

  // ------------------------------------------------
  // Recommendation → Project handoff
  //
  // Recommendations retain their original intelligence
  // ranking metadata.
  //
  // Once Project-backed recommendations are removed,
  // the remaining recommendations receive a separate
  // sequential Dashboard rank for presentation.
  // ------------------------------------------------

    const visibleRecommendations =
    useMemo(
      () =>
        (
          raidDashboard
            .recommendations ??
          []
        )
          .filter(
            recommendation =>
              !recommendationHasProject(
                projects,
                recommendation
              )
          )
          .slice(
            0,
            6
          )
          .map(
            (
              recommendation,
              index
            ) => ({
              ...recommendation,

              dashboardRank:
                index + 1,
            })
          ),
      [
        raidDashboard,
        projects,
      ]
    )

  useEffect(
    () => {
      console.group(
        'PokeIQ Raid Type Profile'
      )

      console.log(
        'Profile summary:',
        {
          status:
            raidTypeProfile.status,

          analyzedCount:
            raidTypeProfile.analyzedCount,

          skippedCount:
            raidTypeProfile.skippedCount,

          benchmarkCount:
            raidTypeProfile.benchmarkCount,

          eligibleTypeRoleCount:
            raidTypeProfile.eligibleTypeRoleCount,

          completeTeamCount:
            raidTypeProfile.completeTeamCount,

          partialTeamCount:
            raidTypeProfile.partialTeamCount,

          emptyTeamCount:
            raidTypeProfile.emptyTeamCount,
        }
      )

      for (
        const type
        of raidTypeProfile
          .typeOrder ??
        []
      ) {
        const typeTeam =
          raidTypeProfile
            .types
            ?.[type]

        if (!typeTeam) {
          continue
        }

        console.group(
          `${type} — ${typeTeam.status} — ` +
          `${typeTeam.filledSlotCount}/${typeTeam.teamSize} — ` +
          `Strength ${typeTeam.strengthScore} — ` +
          `Absolute ${typeTeam.absoluteStrengthScore}`
        )

        const rows =
          buildTypeTeamDebugRows(
            typeTeam
          )

        if (
          rows.length >
          0
        ) {
          console.table(
            rows
          )
        } else {
          console.log(
            'No eligible current attackers.'
          )
        }

        console.groupEnd()
      }

      if (
        raidTypeProfile
          .skippedPokemon
          ?.length >
        0
      ) {
        console.group(
          'Skipped Pokémon'
        )

        console.table(
          raidTypeProfile
            .skippedPokemon
            .map(
              skipped => ({
                Pokémon:
                  skipped
                    ?.pokemon
                    ?.name ??
                  'Unknown',

                CP:
                  skipped
                    ?.pokemon
                    ?.cp ??
                  null,

                Reason:
                  skipped.reason,

                Detail:
                  skipped.detail ??
                  '',
              })
            )
        )

        console.groupEnd()
      }

      console.groupEnd()
    },
    [
      raidTypeProfile,
    ]
  )

  useEffect(
    () => {
      console.group(
        'PokeIQ Raid Recommendation Account Impact'
      )

      console.log(
        'Batch summary:',
        {
          status:
            actionableImpactBatch
              .status,

          recommendationCount:
            actionableImpactBatch
              .recommendations
              ?.length ??
            0,

          successfulCount:
            actionableImpactBatch
              .successfulCount,

          failedCount:
            actionableImpactBatch
              .failedCount,

          positiveImpactCount:
            actionableImpactBatch
              .positiveImpactCount,

          zeroImpactCount:
            actionableImpactBatch
              .zeroImpactCount,

          regressionCount:
            actionableImpactBatch
              .regressionCount,
        }
      )

      if (
        actionableImpactBatch
          .recommendations
          ?.length >
        0
      ) {
        console.table(
          buildRecommendationImpactDebugRows(
            actionableImpactBatch
              .recommendations
          )
        )
      } else {
        console.log(
          'No actionable recommendations available.'
        )
      }

      console.groupEnd()
    },
    [
      actionableImpactBatch,
    ]
  )

  useEffect(
    () => {
      console.group(
        'PokeIQ Potential Evolution Account Impact'
      )

      console.log(
        'Batch summary:',
        {
          status:
            evolutionImpactBatch
              .status,

          recommendationCount:
            evolutionImpactBatch
              .recommendations
              ?.length ??
            0,

          successfulCount:
            evolutionImpactBatch
              .successfulCount,

          failedCount:
            evolutionImpactBatch
              .failedCount,

          positiveImpactCount:
            evolutionImpactBatch
              .positiveImpactCount,

          zeroImpactCount:
            evolutionImpactBatch
              .zeroImpactCount,

          regressionCount:
            evolutionImpactBatch
              .regressionCount,
        }
      )

      if (
        evolutionImpactBatch
          .recommendations
          ?.length >
        0
      ) {
        console.table(
          buildRecommendationImpactDebugRows(
            evolutionImpactBatch
              .recommendations
          )
        )
      } else {
        console.log(
          'No potential evolution investments available.'
        )
      }

      console.groupEnd()
    },
    [
      evolutionImpactBatch,
    ]
  )

  useEffect(
    () => {
      console.group(
        'PokeIQ Account-Aware Raid Ranking'
      )

      console.log(
        'Ranking summary:',
        {
          status:
            accountAwareRanking
              .status,

          recommendationCount:
            accountAwareRanking
              .recommendationCount,

          positiveImpactCount:
            accountAwareRanking
              .positiveImpactCount,

          zeroImpactCount:
            accountAwareRanking
              .zeroImpactCount,

          regressionCount:
            accountAwareRanking
              .regressionCount,
        }
      )

      console.table(
        (
          accountAwareRanking
            .recommendations ??
          []
        ).map(
          recommendation => ({
            Rank:
              recommendation
                .accountAwareRank,

            Previous:
              recommendation
                .previousAccountAwareRank,

            Change:
              recommendation
                .accountAwareRankChange,

            Pokémon:
              getRecommendationName(
                recommendation
              ),

            Recommendation:
              getRecommendationTitle(
                recommendation
              ),

            'Overall %':
              formatSignedPercent(
                recommendation
                  ?.accountImpactSummary
                  ?.overallStrengthPercentChange
              ),

            'Improved Types':
              recommendation
                ?.accountImpactSummary
                ?.improvedTypeCount ??
              0,

            'Regressed Types':
              recommendation
                ?.accountImpactSummary
                ?.regressedTypeCount ??
              0,
          })
        )
      )

      console.groupEnd()
    },
    [
      accountAwareRanking,
    ]
  )

  useEffect(
    () => {
      console.group(
        'PokeIQ Rare Candy Intelligence'
      )

      console.log(
        'Summary:',
        {
          status:
            rareCandyIntelligence
              ?.status,

          recommendationCount:
            rareCandyIntelligence
              ?.recommendationCount ??
            0,

          opportunityCount:
            rareCandyIntelligence
              ?.opportunityCount ??
            0,

          rareCandyOpportunityCount:
            rareCandyIntelligence
              ?.rareCandyOpportunityCount ??
            0,

          rareCandyXlOpportunityCount:
            rareCandyIntelligence
              ?.rareCandyXlOpportunityCount ??
            0,
        }
      )

      console.log(
        'Best current uses:',
        rareCandyIntelligence
          ?.bestCurrentUses
      )

      console.log(
        'Best targets:',
        rareCandyIntelligence
          ?.bestTargets
      )

      const rareCandyRows =
        buildRareCandyDebugRows(
          rareCandyIntelligence
            ?.resourceRankings
            ?.rareCandy
        )

      if (
        rareCandyRows.length >
        0
      ) {
        console.group(
          'Rare Candy Opportunities'
        )

        console.table(
          rareCandyRows
        )

        console.groupEnd()
      } else {
        console.log(
          'No current Rare Candy opportunities.'
        )
      }

      const rareCandyXlRows =
        buildRareCandyDebugRows(
          rareCandyIntelligence
            ?.resourceRankings
            ?.rareCandyXL
        )

      if (
        rareCandyXlRows.length >
        0
      ) {
        console.group(
          'Rare Candy XL Opportunities'
        )

        console.table(
          rareCandyXlRows
        )

        console.groupEnd()
      } else {
        console.log(
          'No current Rare Candy XL opportunities.'
        )
      }

      console.groupEnd()
    },
    [
      rareCandyIntelligence,
    ]
  )

  useEffect(
    () => {
      console.group(
        'PokeIQ Production Recommendation Order'
      )

      console.table(
        (
          raidDashboard
            .recommendations ??
          []
        ).map(
          (
            recommendation,
            index
          ) => ({
            'Intelligence Position':
              index + 1,

            'Visible on Dashboard':
              recommendationHasProject(
                projects,
                recommendation
              )
                ? 'No — In Projects'
                : 'Yes',

            'Account Rank':
              recommendation
                .accountAwareRank ??
              '—',

            'Base Rank':
              recommendation
                .previousAccountAwareRank ??
              recommendation
                .rank ??
              '—',

            Pokémon:
              getRecommendationName(
                recommendation
              ),

            Recommendation:
              getRecommendationTitle(
                recommendation
              ),

            'Overall Account %':
              formatSignedPercent(
                recommendation
                  ?.accountImpactSummary
                  ?.overallStrengthPercentChange
              ),

            'Rare Candy':
              recommendation
                ?.rareCandyIntelligence
                ?.rareCandy
                ?.recommendation
                ?.label ??
              '—',

            'Rare Candy XL':
              recommendation
                ?.rareCandyIntelligence
                ?.rareCandyXL
                ?.recommendation
                ?.label ??
              '—',
          })
        )
      )

      console.groupEnd()
    },
    [
      raidDashboard,
      projects,
    ]
  )

  useEffect(
    () => {
      console.group(
        'PokeIQ Visible Dashboard Recommendations'
      )

      console.table(
        visibleRecommendations.map(
          recommendation => ({
            'Dashboard Rank':
              recommendation
                .dashboardRank,

            'Account Rank':
              recommendation
                .accountAwareRank ??
              '—',

            'Base Rank':
              recommendation
                .rank ??
              '—',

            Pokémon:
              getRecommendationName(
                recommendation
              ),

            Recommendation:
              getRecommendationTitle(
                recommendation
              ),
          })
        )
      )

      console.groupEnd()
    },
    [
      visibleRecommendations,
    ]
  )

  const hasRecommendations =
    visibleRecommendations.length >
    0

  const potentialEvolutionInvestments =
    raidDashboard
      .potentialEvolutionInvestments ??
    []

  const hasPotentialEvolutionInvestments =
    potentialEvolutionInvestments
      .length > 0

  return (
    <main className="app">
      <header className="header dashboard-hero">
        <p className="eyebrow">
          PokeIQ
        </p>

        <h1 className="dashboard-hero-title">
          Good evening, Carter
        </h1>

        <p className="subtitle dashboard-hero-subtitle">
          Here are the most valuable
          raid investments available
          in your collection right now.
        </p>
      </header>

      <section className="section dashboard-recommendations-section">
        <div className="section-header dashboard-section-header">
          <div>
            <h2>
              Recommended Next Steps
            </h2>

            <p>
              Ranked using your actual
              Pokémon, exact moves,
              account needs, and
              general raid performance.
            </p>
          </div>
        </div>

        {pokemonCollection.length ===
        0 ? (
          <div className="card empty-state">
            <h3>
              Add some Pokémon first
            </h3>

            <p>
              Raid investment
              recommendations will
              appear here once your
              collection contains
              Pokémon that can be
              analyzed.
            </p>
          </div>
        ) : hasRecommendations ? (
          <div className="grid">
            {visibleRecommendations.map(
              recommendation => (
                <RecommendationCard
                  key={
                    recommendation
                      .collectionId
                  }
                  recommendation={
                    recommendation
                  }
                  displayRank={
                    recommendation
                      .dashboardRank
                  }
                  isInProjects={
                    false
                  }
                  onAddProject={
                    onAddProject
                  }
                  onUpdateCandyFamilyBalance={
                    onUpdateCandyFamilyBalance
                  }
                />
              )
            )}
          </div>
        ) : (
          <div className="card empty-state">
            <h3>
              No new raid investments
            </h3>

            <p>
              PokeIQ does not have
              another actionable raid
              investment to recommend
              right now. Investments
              you've already chosen are
              tracked under Projects.
            </p>
          </div>
        )}
      </section>

      {hasPotentialEvolutionInvestments && (
        <section className="section dashboard-evolution-section">
          <div className="section-header dashboard-section-header">
            <div>
              <h2>
                Potential Evolution
                Investments
              </h2>

              <p>
                These evolution paths
                could create stronger
                raid attackers, but the
                exact post-evolution
                moveset is not
                guaranteed.
              </p>
            </div>
          </div>

          <div className="grid">
            {potentialEvolutionInvestments.map(
              recommendation => (
                <RecommendationCard
                  key={
                    `evolution-${recommendation.collectionId}-${recommendation.rank}`
                  }
                  recommendation={
                    recommendation
                  }
                  displayRank={
                    recommendation
                      .rank
                  }
                  isInProjects={
                    false
                  }
                  onAddProject={
                    null
                  }
                  onUpdateCandyFamilyBalance={
                    onUpdateCandyFamilyBalance
                  }
                />
              )
            )}
          </div>
        </section>
      )}

      <section className="section dashboard-analysis-section">
        <div className="section-header dashboard-section-header">
          <div>
            <h2>
              Raid Analysis
            </h2>

            <p>
              Your collection is
              analyzed against stable
              raid benchmarks and
              separated into actionable
              recommendations and
              longer-term opportunities.
            </p>
          </div>
        </div>

        <div className="card opportunity-card dashboard-analysis-card">
          <div className="meta-row">
            <span>
              Pokémon analyzed
            </span>

            <strong>
              {
                raidDashboard
                  .analyzedCount
              }
            </strong>
          </div>

          <div className="meta-row">
            <span>
              Pokémon skipped
            </span>

            <strong>
              {
                raidDashboard
                  .skippedCount
              }
            </strong>
          </div>

          <div className="meta-row">
            <span>
              Stable raid benchmarks
            </span>

            <strong>
              {
                raidDashboard
                  .benchmarkCount
              }
            </strong>
          </div>

          <div className="meta-row">
            <span>
              Actionable investments
            </span>

            <strong>
              {
                raidDashboard
                  .actionableCount ??
                0
              }
            </strong>
          </div>

          <div className="meta-row">
            <span>
              Potential evolution
              investments
            </span>

            <strong>
              {
                raidDashboard
                  .potentialEvolutionInvestmentCount ??
                0
              }
            </strong>
          </div>

          <div className="meta-row">
            <span>
              Stochastic destinations
            </span>

            <strong>
              {
                raidDashboard
                  .stochasticDestinationCount ??
                0
              }
            </strong>
          </div>

          <div className="meta-row">
            <span>
              High-value investments
            </span>

            <strong>
              {
                raidDashboard
                  .highValueCount ??
                0
              }
            </strong>
          </div>
        </div>
      </section>
    </main>
  )
}

export default Dashboard