package org.jahia.community.reportusersandgroups;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

import static org.assertj.core.api.Assertions.assertThat;

@DisplayName("ReportUsersAndGroupsCommand.sanitizeCsv — CSV/formula injection neutralization")
class ReportUsersAndGroupsCommandTest {

    @Test
    @DisplayName("returns null unchanged")
    void sanitizeCsv_null_returnsNull() {
        assertThat(ReportUsersAndGroupsCommand.sanitizeCsv(null)).isNull();
    }

    @Test
    @DisplayName("returns empty string unchanged")
    void sanitizeCsv_empty_returnsEmpty() {
        assertThat(ReportUsersAndGroupsCommand.sanitizeCsv("")).isEmpty();
    }

    @ParameterizedTest
    @ValueSource(strings = {
            "=1+1",
            "=cmd|'/c calc'!A1",
            "+1234567890",
            "-2+3",
            "@SUM(A1:A2)"
    })
    @DisplayName("prefixes apostrophe when value starts with a formula trigger character")
    void sanitizeCsv_leadingFormulaChar_isNeutralized(String dangerous) {
        assertThat(ReportUsersAndGroupsCommand.sanitizeCsv(dangerous)).isEqualTo("'" + dangerous);
    }

    @Test
    @DisplayName("neutralizes a value beginning with a TAB control character")
    void sanitizeCsv_leadingTab_isNeutralized() {
        assertThat(ReportUsersAndGroupsCommand.sanitizeCsv("\t=1+1")).isEqualTo("'\t=1+1");
    }

    @Test
    @DisplayName("neutralizes a value beginning with a carriage return control character")
    void sanitizeCsv_leadingCarriageReturn_isNeutralized() {
        assertThat(ReportUsersAndGroupsCommand.sanitizeCsv("\r=1+1")).isEqualTo("'\r=1+1");
    }

    @ParameterizedTest
    @ValueSource(strings = {
            " =1+1",
            "   =1+1",
            "  @SUM(A1:A2)",
            " +1+1"
    })
    @DisplayName("neutralizes leading-whitespace bypass before a formula trigger")
    void sanitizeCsv_leadingSpaceThenFormulaChar_isNeutralized(String dangerous) {
        assertThat(ReportUsersAndGroupsCommand.sanitizeCsv(dangerous)).isEqualTo("'" + dangerous);
    }

    @ParameterizedTest
    @ValueSource(strings = {
            "Alice",
            "j:firstName",
            "user@example.com",
            "Group1, Group2",
            "1+1=2",
            "normal value",
            "  trailing space ok  "
    })
    @DisplayName("leaves benign values unchanged")
    void sanitizeCsv_benignValue_isUnchanged(String safe) {
        assertThat(ReportUsersAndGroupsCommand.sanitizeCsv(safe)).isEqualTo(safe);
    }

    @Test
    @DisplayName("a value of only whitespace is left unchanged")
    void sanitizeCsv_onlyWhitespace_isUnchanged() {
        assertThat(ReportUsersAndGroupsCommand.sanitizeCsv("   ")).isEqualTo("   ");
    }
}
