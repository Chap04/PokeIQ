import {
  useEffect,
  useRef,
  useState,
} from 'react'

import PokemonPicker from './PokemonPicker'
import PokemonArtwork from './PokemonArtwork'

import {
  getChargedMoveOptions,
  getFastMoveOptions,
  getPokemonDisplayName,
  getPokemonIdentity,
  getPokemonReferenceByIdentity,
} from '../utils/pokemonReference'

import {
  formatMoveName,
} from '../utils/formatMoveName'

const FRUSTRATION_MOVE_ID =
  'FRUSTRATION'

const RETURN_MOVE_ID =
  'RETURN'

function AddPokemonForm({
  onAddPokemon,
  onUpdatePokemon,
  editingPokemon,
  onCancelEditing,
}) {
  const [
    selectedPokemon,
    setSelectedPokemon,
  ] =
    useState(
      null
    )

  const [
    searchTerm,
    setSearchTerm,
  ] =
    useState(
      ''
    )

  const [
    cp,
    setCp,
  ] =
    useState(
      ''
    )

  const [
    attackIv,
    setAttackIv,
  ] =
    useState(
      ''
    )

  const [
    defenseIv,
    setDefenseIv,
  ] =
    useState(
      ''
    )

  const [
    staminaIv,
    setStaminaIv,
  ] =
    useState(
      ''
    )

  const [
    fastMoveId,
    setFastMoveId,
  ] =
    useState(
      ''
    )

  const [
    chargedMove1Id,
    setChargedMove1Id,
  ] =
    useState(
      ''
    )

  const [
    chargedMove2Id,
    setChargedMove2Id,
  ] =
    useState(
      ''
    )

  const [
    shiny,
    setShiny,
  ] =
    useState(
      false
    )

  const [
    shadow,
    setShadow,
  ] =
    useState(
      false
    )

  const [
    purified,
    setPurified,
  ] =
    useState(
      false
    )

  const [
    lucky,
    setLucky,
  ] =
    useState(
      false
    )

  const [
    favorite,
    setFavorite,
  ] =
    useState(
      false
    )

  const initializingEditRef =
    useRef(
      false
    )

  useEffect(
    () => {
      if (
        editingPokemon
      ) {
        initializingEditRef.current =
          true

        const referencePokemon =
          editingPokemon
            .pokemonIdentity
            ? getPokemonReferenceByIdentity(
                editingPokemon
                  .pokemonIdentity
              )
            : null

        if (
          referencePokemon
        ) {
          setSelectedPokemon({
            ...referencePokemon,

            name:
              getPokemonDisplayName(
                referencePokemon
              ),

            identity:
              getPokemonIdentity(
                referencePokemon
              ),
          })

          setSearchTerm(
            getPokemonDisplayName(
              referencePokemon
            )
          )
        } else {
          setSelectedPokemon(
            null
          )

          setSearchTerm(
            editingPokemon
              .name ??
            ''
          )
        }

        setCp(
          String(
            editingPokemon
              .cp ??
            ''
          )
        )

        setAttackIv(
          editingPokemon
            .ivs
            ?.attack !==
            null &&
          editingPokemon
            .ivs
            ?.attack !==
            undefined
            ? String(
                editingPokemon
                  .ivs
                  .attack
              )
            : ''
        )

        setDefenseIv(
          editingPokemon
            .ivs
            ?.defense !==
            null &&
          editingPokemon
            .ivs
            ?.defense !==
            undefined
            ? String(
                editingPokemon
                  .ivs
                  .defense
              )
            : ''
        )

        setStaminaIv(
          editingPokemon
            .ivs
            ?.stamina !==
            null &&
          editingPokemon
            .ivs
            ?.stamina !==
            undefined
            ? String(
                editingPokemon
                  .ivs
                  .stamina
              )
            : ''
        )

        setFastMoveId(
          editingPokemon
            .fastMoveId ??
          ''
        )

        setChargedMove1Id(
          editingPokemon
            .chargedMove1Id ??
          ''
        )

        setChargedMove2Id(
          editingPokemon
            .chargedMove2Id ??
          ''
        )

        setShiny(
          editingPokemon
            .shiny ??
          false
        )

        setShadow(
          editingPokemon
            .shadow ??
          false
        )

        setPurified(
          editingPokemon
            .purified ??
          false
        )

        setLucky(
          editingPokemon
            .lucky ??
          false
        )

        setFavorite(
          editingPokemon
            .favorite ??
          false
        )

        return
      }

      initializingEditRef.current =
        false

      resetForm()
    },
    [
      editingPokemon,
    ]
  )

  function resetForm() {
    setSelectedPokemon(
      null
    )

    setSearchTerm(
      ''
    )

    setCp(
      ''
    )

    setAttackIv(
      ''
    )

    setDefenseIv(
      ''
    )

    setStaminaIv(
      ''
    )

    setFastMoveId(
      ''
    )

    setChargedMove1Id(
      ''
    )

    setChargedMove2Id(
      ''
    )

    setShiny(
      false
    )

    setShadow(
      false
    )

    setPurified(
      false
    )

    setLucky(
      false
    )

    setFavorite(
      false
    )
  }

  function convertIv(
    value
  ) {
    if (
      value ===
      ''
    ) {
      return null
    }

    return Number(
      value
    )
  }

  function clearChargedMove(
    moveId
  ) {
    if (
      chargedMove1Id ===
      moveId
    ) {
      setChargedMove1Id(
        ''
      )
    }

    if (
      chargedMove2Id ===
      moveId
    ) {
      setChargedMove2Id(
        ''
      )
    }
  }

  function handleShadowChange(
    event
  ) {
    const isShadow =
      event
        .target
        .checked

    setShadow(
      isShadow
    )

    if (
      isShadow
    ) {
      setPurified(
        false
      )

      setLucky(
        false
      )

      clearChargedMove(
        RETURN_MOVE_ID
      )
    } else {
      clearChargedMove(
        FRUSTRATION_MOVE_ID
      )
    }
  }

  function handlePurifiedChange(
    event
  ) {
    const isPurified =
      event
        .target
        .checked

    setPurified(
      isPurified
    )

    if (
      isPurified
    ) {
      setShadow(
        false
      )

      clearChargedMove(
        FRUSTRATION_MOVE_ID
      )
    } else {
      clearChargedMove(
        RETURN_MOVE_ID
      )
    }
  }

  function handleLuckyChange(
    event
  ) {
    const isLucky =
      event
        .target
        .checked

    setLucky(
      isLucky
    )

    if (
      isLucky
    ) {
      setShadow(
        false
      )

      clearChargedMove(
        FRUSTRATION_MOVE_ID
      )
    }
  }

  function handlePokemonSelect(
    pokemon
  ) {
    const previousIdentity =
      selectedPokemon
        ? getPokemonIdentity(
            selectedPokemon
          )
        : null

    const nextIdentity =
      pokemon
        ? getPokemonIdentity(
            pokemon
          )
        : null

    setSelectedPokemon(
      pokemon
    )

    if (
      previousIdentity !==
      nextIdentity
    ) {
      setFastMoveId(
        ''
      )

      setChargedMove1Id(
        ''
      )

      setChargedMove2Id(
        ''
      )
    }

    initializingEditRef.current =
      false
  }

  function handleSubmit(
    event
  ) {
    event.preventDefault()

    if (
      !selectedPokemon
    ) {
      return
    }

    const pokemonData = {
      pokemonId:
        selectedPokemon
          .id,

      pokemonForm:
        selectedPokemon
          .form,

      pokemonIdentity:
        getPokemonIdentity(
          selectedPokemon
        ),

      name:
        getPokemonDisplayName(
          selectedPokemon
        ),

      cp:
        Number(
          cp
        ) ||
        0,

      ivs: {
        attack:
          convertIv(
            attackIv
          ),

        defense:
          convertIv(
            defenseIv
          ),

        stamina:
          convertIv(
            staminaIv
          ),
      },

      fastMoveId:
        fastMoveId ||
        null,

      chargedMove1Id:
        chargedMove1Id ||
        null,

      chargedMove2Id:
        chargedMove2Id ||
        null,

      shiny,
      shadow,
      purified,
      lucky,
      favorite,
    }

    if (
      editingPokemon
    ) {
      onUpdatePokemon({
        ...editingPokemon,
        ...pokemonData,
      })
    } else {
      onAddPokemon({
        id:
          crypto
            .randomUUID(),

        ...pokemonData,
      })
    }

    resetForm()
  }

  function handleCancel() {
    resetForm()

    onCancelEditing()
  }

  const fastMoveOptions =
    selectedPokemon
      ? getFastMoveOptions(
          selectedPokemon
        )
      : []

  const chargedMoveOptions =
    selectedPokemon
      ? getChargedMoveOptions(
          selectedPokemon,
          {
            shadow,
            purified,
          }
        )
      : []

  const previewVariant =
    shadow
      ? 'shadow'
      : purified
        ? 'purified'
        : 'normal'

  return (
    <form
      className="card collection-form"
      onSubmit={handleSubmit}
    >
      <h2>
        {
          editingPokemon
            ? 'Edit Pokémon'
            : 'Add a Pokémon'
        }
      </h2>

      <div className="pokemon-entry-layout">
        <div className="pokemon-entry-fields">
          <PokemonPicker
            searchTerm={
              searchTerm
            }

            onSearchTermChange={
              setSearchTerm
            }

            selectedPokemon={
              selectedPokemon
            }

            onSelectPokemon={
              handlePokemonSelect
            }
          />

          <label>
            CP

            <input
              type="number"
              min="0"
              value={
                cp
              }

              onChange={
                (
                  event
                ) =>
                  setCp(
                    event
                      .target
                      .value
                  )
              }

              placeholder="3120"
            />
          </label>

          <fieldset className="iv-fieldset">
            <legend>
              IVs
            </legend>

            <div className="iv-input-grid">
              <label>
                Attack

                <input
                  type="number"
                  min="0"
                  max="15"

                  value={
                    attackIv
                  }

                  onChange={
                    (
                      event
                    ) =>
                      setAttackIv(
                        event
                          .target
                          .value
                      )
                  }

                  placeholder="15"
                />
              </label>

              <label>
                Defense

                <input
                  type="number"
                  min="0"
                  max="15"

                  value={
                    defenseIv
                  }

                  onChange={
                    (
                      event
                    ) =>
                      setDefenseIv(
                        event
                          .target
                          .value
                      )
                  }

                  placeholder="15"
                />
              </label>

              <label>
                HP

                <input
                  type="number"
                  min="0"
                  max="15"

                  value={
                    staminaIv
                  }

                  onChange={
                    (
                      event
                    ) =>
                      setStaminaIv(
                        event
                          .target
                          .value
                      )
                  }

                  placeholder="15"
                />
              </label>
            </div>
          </fieldset>

          <fieldset className="moves-fieldset">
            <legend>
              Moves
            </legend>

            <div className="move-input-grid">
              <label>
                Fast Move

                <select
                  value={
                    fastMoveId
                  }

                  onChange={
                    (
                      event
                    ) =>
                      setFastMoveId(
                        event
                          .target
                          .value
                      )
                  }

                  disabled={
                    !selectedPokemon
                  }
                >
                  <option value="">
                    {
                      selectedPokemon
                        ? 'Select Fast Move'
                        : 'Select a Pokémon first'
                    }
                  </option>

                  {
                    fastMoveOptions.map(
                      (
                        move
                      ) => (
                        <option
                          key={
                            move.id
                          }

                          value={
                            move.id
                          }
                        >
                          {
                            formatMoveName(
                              move.id
                            )
                          }

                          {
                            move
                              .availability !==
                            'NORMAL'
                              ? ` — ${move.availability}`
                              : ''
                          }
                        </option>
                      )
                    )
                  }
                </select>
              </label>

              <label>
                Charged Move 1

                <select
                  value={
                    chargedMove1Id
                  }

                  onChange={
                    (
                      event
                    ) =>
                      setChargedMove1Id(
                        event
                          .target
                          .value
                      )
                  }

                  disabled={
                    !selectedPokemon
                  }
                >
                  <option value="">
                    {
                      selectedPokemon
                        ? 'Select Charged Move'
                        : 'Select a Pokémon first'
                    }
                  </option>

                  {
                    chargedMoveOptions.map(
                      (
                        move
                      ) => (
                        <option
                          key={
                            move.id
                          }

                          value={
                            move.id
                          }
                        >
                          {
                            formatMoveName(
                              move.id
                            )
                          }

                          {
                            move
                              .availability !==
                            'NORMAL'
                              ? ` — ${move.availability}`
                              : ''
                          }
                        </option>
                      )
                    )
                  }
                </select>
              </label>

              <label>
                Charged Move 2

                <select
                  value={
                    chargedMove2Id
                  }

                  onChange={
                    (
                      event
                    ) =>
                      setChargedMove2Id(
                        event
                          .target
                          .value
                      )
                  }

                  disabled={
                    !selectedPokemon
                  }
                >
                  <option value="">
                    None
                  </option>

                  {
                    chargedMoveOptions.map(
                      (
                        move
                      ) => (
                        <option
                          key={
                            move.id
                          }

                          value={
                            move.id
                          }
                        >
                          {
                            formatMoveName(
                              move.id
                            )
                          }

                          {
                            move
                              .availability !==
                            'NORMAL'
                              ? ` — ${move.availability}`
                              : ''
                          }
                        </option>
                      )
                    )
                  }
                </select>
              </label>
            </div>
          </fieldset>

          <fieldset className="traits-fieldset">
            <legend>
              Traits
            </legend>

            <div className="trait-grid">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={
                    shiny
                  }

                  onChange={
                    (
                      event
                    ) =>
                      setShiny(
                        event
                          .target
                          .checked
                      )
                  }
                />

                Shiny
              </label>

              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={
                    shadow
                  }

                  onChange={
                    handleShadowChange
                  }
                />

                Shadow
              </label>

              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={
                    purified
                  }

                  onChange={
                    handlePurifiedChange
                  }
                />

                Purified
              </label>

              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={
                    lucky
                  }

                  onChange={
                    handleLuckyChange
                  }
                />

                Lucky
              </label>

              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={
                    favorite
                  }

                  onChange={
                    (
                      event
                    ) =>
                      setFavorite(
                        event
                          .target
                          .checked
                      )
                  }
                />

                Favorite
              </label>
            </div>
          </fieldset>
        </div>

        <div className="pokemon-entry-preview">
          {
            selectedPokemon
              ? (
                <>
                  <PokemonArtwork
                    pokemon={{
                      id:
                        selectedPokemon
                          .id,

                      name:
                        getPokemonDisplayName(
                          selectedPokemon
                        ),

                      shiny,

                      variant:
                        previewVariant,
                    }}
                  />

                  <div>
                    <h3>
                      {
                        favorite &&
                        (
                          <span className="favorite-star">
                            ★{' '}
                          </span>
                        )
                      }

                      {
                        getPokemonDisplayName(
                          selectedPokemon
                        )
                      }
                    </h3>

                    {
                      cp &&
                      (
                        <p className="preview-cp">
                          CP {cp}
                        </p>
                      )
                    }
                  </div>
                </>
              )
              : (
                <p className="preview-placeholder">
                  Select a Pokémon to preview it here.
                </p>
              )
          }
        </div>
      </div>

      <div className="form-actions">
        <button
          className="primary-button"
          type="submit"

          disabled={
            !selectedPokemon
          }
        >
          {
            editingPokemon
              ? 'Save Changes'
              : 'Add Pokémon'
          }
        </button>

        {
          editingPokemon &&
          (
            <button
              className="secondary-button"
              type="button"

              onClick={
                handleCancel
              }
            >
              Cancel
            </button>
          )
        }
      </div>
    </form>
  )
}

export default AddPokemonForm