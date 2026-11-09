# Mutations

Written by `python scripts/mutate.py --table docs/MUTATIONS.md`. 85 defences in
`contracts/prior.py` were each broken on their own, and every mutant was caught. Each row
names the first test that failed against it, read from pytest's report rather than an exit code.
The generated-copy and deployed-record tests are excluded, because they fail for any edit at all.

| # | defence broken | caught by |
|---|---|---|
| 1 | reveal: anyone may reveal | `tests/test_direct.py::test_only_the_author_reveals_and_only_once` |
| 2 | reveal: no seal check | `tests/test_direct.py::test_a_wrong_text_or_salt_does_not_match_the_seal` |
| 3 | reveal: the seal ignores the author | `tests/test_direct.py::test_reveal_checks_the_text_against_the_seal_and_never_moves_the_date` |
| 4 | reveal: twice | `tests/test_direct.py::test_only_the_author_reveals_and_only_once` |
| 5 | reveal: the date moves | `tests/test_direct.py::test_reveal_checks_the_text_against_the_seal_and_never_moves_the_date` |
| 6 | reveal: a 1501 character text | `tests/test_direct.py::test_the_text_limits_and_the_salt_rules` |
| 7 | reveal: an empty text | `tests/test_direct.py::test_the_text_limits_and_the_salt_rules` |
| 8 | reveal: a bar in the salt | `tests/test_direct.py::test_the_text_limits_and_the_salt_rules` |
| 9 | register: a bond under 2 GEN | `tests/test_direct.py::test_the_bond_is_at_least_two_gen` |
| 10 | register: no bond check | `tests/test_direct.py::test_the_bond_is_at_least_two_gen` |
| 11 | register: the same seal twice | `tests/test_direct.py::test_a_seal_is_a_sha256_and_registers_once` |
| 12 | register: any string is a seal | `tests/test_direct.py::test_a_seal_is_a_sha256_and_registers_once` |
| 13 | register: the date is not stamped | `tests/test_direct.py::test_register_stamps_the_chain_time_and_holds_the_bond` |
| 14 | register: the author is nobody | `tests/test_direct.py::test_register_stamps_the_chain_time_and_holds_the_bond` |
| 15 | register: the bond is not counted as received | `tests/test_direct.py::test_register_stamps_the_chain_time_and_holds_the_bond` |
| 16 | register: the bond is not held | `tests/test_direct.py::test_register_stamps_the_chain_time_and_holds_the_bond` |
| 17 | challenge: anyone may file | `tests/test_direct.py::test_only_the_earlier_author_files_and_the_stake_is_exact` |
| 18 | challenge: the later author files | `tests/test_direct.py::test_a_challenge_needs_both_revealed_and_a_strictly_earlier` |
| 19 | challenge: the later entry may be unrevealed | `tests/test_direct.py::test_a_challenge_needs_both_revealed_and_a_strictly_earlier` |
| 20 | challenge: the earlier entry may be unrevealed | `tests/test_direct.py::test_the_earlier_entry_must_be_revealed_too` |
| 21 | challenge: same-second seals count as earlier | `tests/test_direct.py::test_the_earlier_entry_must_be_sealed_strictly_before` |
| 22 | challenge: the order is not checked | `tests/test_direct.py::test_the_earlier_entry_must_be_sealed_strictly_before` |
| 23 | challenge: a pair twice | `tests/test_direct.py::test_a_pair_can_be_challenged_once` |
| 24 | challenge: any stake | `tests/test_direct.py::test_only_the_earlier_author_files_and_the_stake_is_exact` |
| 25 | challenge: a stake that is too small | `tests/test_direct.py::test_only_the_earlier_author_files_and_the_stake_is_exact` |
| 26 | challenge: a stake of 6 GEN | `tests/test_direct.py::test_a_challenge_needs_both_revealed_and_a_strictly_earlier` |
| 27 | challenge: an entry against itself | `tests/test_direct.py::test_only_the_earlier_author_files_and_the_stake_is_exact` |
| 28 | challenge: the 90 days run a day longer | `tests/test_direct.py::test_after_90_days_a_prior_still_marks_but_there_is_no_bond_to_win` |
| 29 | challenge: the 90 days are not checked | `tests/test_direct.py::test_after_90_days_a_prior_still_marks_but_there_is_no_bond_to_win` |
| 30 | challenge: the accused is the challenger | `tests/test_direct.py::test_a_challenge_needs_both_revealed_and_a_strictly_earlier` |
| 31 | challenge: the stake is not held | `tests/test_direct.py::test_a_challenge_needs_both_revealed_and_a_strictly_earlier` |
| 32 | challenge: the stake is not counted as received | `tests/test_direct.py::test_a_challenge_needs_both_revealed_and_a_strictly_earlier` |
| 33 | challenge: the open count is not raised | `tests/test_direct.py::test_a_challenge_needs_both_revealed_and_a_strictly_earlier` |
| 34 | judge: a challenge is read twice | `tests/test_direct.py::test_a_challenge_is_read_once` |
| 35 | judge: the order is not asserted | `tests/test_static.py::test_the_verdict_is_code_and_priority_is_a_fact_in_code` |
| 36 | judge: the later text is TEXT 1 | `tests/test_direct.py::test_the_earlier_text_is_always_text_one_and_the_judge_sees_no_dates_names_or_addresses` |
| 37 | judge: the dates are in the prompt | `tests/test_direct.py::test_the_earlier_text_is_always_text_one_and_the_judge_sees_no_dates_names_or_addresses` |
| 38 | judge: validators agree with anything | `tests/test_direct.py::test_validators_compare_the_label_and_nothing_else` |
| 39 | judge: an unreadable label defaults to NONE | `tests/test_direct.py::test_read_answer_refuses_what_is_not_one_of_three_labels[{}]` |
| 40 | judge: no retry on a slip | `tests/test_direct.py::test_a_formatting_slip_is_retried_once_and_two_slips_settle_nothing` |
| 41 | judge: past the deadline the model runs | `tests/test_direct.py::test_a_challenge_nobody_could_read_is_voided_after_48_hours_and_the_pair_is_free_again` |
| 42 | judge: a 72 hour deadline | `tests/test_direct.py::test_a_challenge_nobody_could_read_is_voided_after_48_hours_and_the_pair_is_free_again` |
| 43 | verdict: SUBSTANTIAL is RELATED | `tests/test_direct.py::test_the_worked_example_substantial_is_prior_and_the_bond_moves` |
| 44 | verdict: PARTIAL is PRIOR | `tests/test_direct.py::test_partial_is_related_stake_back_and_the_bond_stays` |
| 45 | verdict: NONE is RELATED | `tests/test_direct.py::test_none_is_cleared_and_the_stake_goes_to_the_accused` |
| 46 | settle: PRIOR wins no bond | `tests/test_direct.py::test_the_worked_example_substantial_is_prior_and_the_bond_moves` |
| 47 | settle: PRIOR always wins the bond | `tests/test_direct.py::test_after_90_days_a_prior_still_marks_but_there_is_no_bond_to_win` |
| 48 | settle: PRIOR does not take the bond from B | `tests/test_direct.py::test_the_worked_example_substantial_is_prior_and_the_bond_moves` |
| 49 | settle: PRIOR does not lower the bonds held | `tests/test_direct.py::test_the_worked_example_substantial_is_prior_and_the_bond_moves` |
| 50 | settle: PRIOR does not return the stake | `tests/test_direct.py::test_the_worked_example_substantial_is_prior_and_the_bond_moves` |
| 51 | settle: PRIOR pays the accused | `tests/test_direct.py::test_the_worked_example_substantial_is_prior_and_the_bond_moves` |
| 52 | settle: PRIOR does not mark B | `tests/test_direct.py::test_the_worked_example_substantial_is_prior_and_the_bond_moves` |
| 53 | settle: PRIOR marks A instead | `tests/test_direct.py::test_the_worked_example_substantial_is_prior_and_the_bond_moves` |
| 54 | settle: RELATED pays the bond too | `tests/test_direct.py::test_partial_is_related_stake_back_and_the_bond_stays` |
| 55 | settle: RELATED does not note A | `tests/test_direct.py::test_partial_is_related_stake_back_and_the_bond_stays` |
| 56 | settle: RELATED does not note B | `tests/test_direct.py::test_partial_is_related_stake_back_and_the_bond_stays` |
| 57 | settle: RELATED returns no stake | `tests/test_direct.py::test_partial_is_related_stake_back_and_the_bond_stays` |
| 58 | settle: CLEARED pays the challenger | `tests/test_direct.py::test_none_is_cleared_and_the_stake_goes_to_the_accused` |
| 59 | settle: CLEARED pays nobody | `tests/test_direct.py::test_none_is_cleared_and_the_stake_goes_to_the_accused` |
| 60 | settle: CLEARED is not noted | `tests/test_direct.py::test_none_is_cleared_and_the_stake_goes_to_the_accused` |
| 61 | settle: the stake is still held after a verdict | `tests/test_direct.py::test_the_worked_example_substantial_is_prior_and_the_bond_moves` |
| 62 | settle: the open count is not lowered | `tests/test_direct.py::test_the_worked_example_substantial_is_prior_and_the_bond_moves` |
| 63 | settle: a voided stake is not returned | `tests/test_direct.py::test_a_challenge_nobody_could_read_is_voided_after_48_hours_and_the_pair_is_free_again` |
| 64 | settle: a voided pair stays used | `tests/test_direct.py::test_a_challenge_nobody_could_read_is_voided_after_48_hours_and_the_pair_is_free_again` |
| 65 | close: before 90 days | `tests/test_direct.py::test_an_entry_seasons_after_90_days_and_the_bond_returns_to_its_author` |
| 66 | close: on the last second | `tests/test_direct.py::test_an_entry_seasons_after_90_days_and_the_bond_returns_to_its_author` |
| 67 | close: 91 days | `tests/test_direct.py::test_register_stamps_the_chain_time_and_holds_the_bond` |
| 68 | close: with an open challenge | `tests/test_direct.py::test_an_entry_with_an_open_challenge_cannot_season` |
| 69 | close: an overlapping entry seasons | `tests/test_direct.py::test_an_entry_marked_as_overlapping_does_not_season` |
| 70 | close: twice | `tests/test_direct.py::test_an_entry_seasons_after_90_days_and_the_bond_returns_to_its_author` |
| 71 | close: the bond goes to the caller | `tests/test_direct.py::test_an_entry_seasons_after_90_days_and_the_bond_returns_to_its_author` |
| 72 | close: the bond is not credited | `tests/test_direct.py::test_an_entry_seasons_after_90_days_and_the_bond_returns_to_its_author` |
| 73 | close: the bond is not emptied | `tests/test_direct.py::test_an_entry_seasons_after_90_days_and_the_bond_returns_to_its_author` |
| 74 | close: the bonds held are not lowered | `tests/test_direct.py::test_an_entry_seasons_after_90_days_and_the_bond_returns_to_its_author` |
| 75 | close: the entry does not season | `tests/test_direct.py::test_an_entry_seasons_after_90_days_and_the_bond_returns_to_its_author` |
| 76 | close: the caller is not recorded | `tests/test_direct.py::test_an_entry_seasons_after_90_days_and_the_bond_returns_to_its_author` |
| 77 | withdraw: the balance is not cleared | `tests/test_direct.py::test_the_worked_example_substantial_is_prior_and_the_bond_moves` |
| 78 | withdraw: a zero balance sends | `tests/test_direct.py::test_withdraw_is_a_top_level_transfer_of_the_whole_balance_to_the_caller` |
| 79 | withdraw: pays a fixed address | `tests/test_direct.py::test_the_worked_example_substantial_is_prior_and_the_bond_moves` |
| 80 | withdraw: the owed total is not lowered | `tests/test_direct.py::test_the_worked_example_substantial_is_prior_and_the_bond_moves` |
| 81 | withdraw: the paid total is not raised | `tests/test_direct.py::test_the_worked_example_substantial_is_prior_and_the_bond_moves` |
| 82 | credit: the owed total is not raised | `tests/test_direct.py::test_the_worked_example_substantial_is_prior_and_the_bond_moves` |
| 83 | prompt: the fence lets delimiters through | `tests/test_direct.py::test_a_text_that_gives_the_judge_an_order_cannot_close_the_block` |
| 84 | prompt: TEXT 2 is unfenced | `tests/test_direct.py::test_a_text_that_gives_the_judge_an_order_cannot_close_the_block` |
| 85 | prompt: TEXT 1 is unfenced | `tests/test_static.py::test_every_prompt_value_is_fenced_and_the_earlier_text_is_text_one` |
