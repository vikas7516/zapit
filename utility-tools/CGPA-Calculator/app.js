(function () {
    "use strict";

    const semesterContainer = document.getElementById("semesterContainer");
    const semesterSummary = document.getElementById("semesterSummary");
    const semesterSummaryList = document.getElementById("semesterSummaryList");
    const statusBanner = document.getElementById("statusBanner");

    const cgpaValue = document.getElementById("cgpaValue");
    const totalCreditsEl = document.getElementById("totalCredits");
    const courseCountEl = document.getElementById("courseCount");
    const bestSemesterEl = document.getElementById("bestSemester");
    const standingLabelEl = document.getElementById("standingLabel");

    const resultsTableBody = document.getElementById("resultsTableBody");

    const addSemesterBtn = document.getElementById("addSemesterBtn");
    const calculateBtn = document.getElementById("calculateBtn");
    const copySummaryBtn = document.getElementById("copySummaryBtn");
    const downloadReportBtn = document.getElementById("downloadReportBtn");
    const loadSampleBtn = document.getElementById("loadSampleBtn");
    const clearAllBtn = document.getElementById("clearAllBtn");

    if (!semesterContainer) {
        return;
    }

    const gradeScale = [
        { label: "A+", value: "A+", points: 10 },
        { label: "A", value: "A", points: 9 },
        { label: "B+", value: "B+", points: 8 },
        { label: "B", value: "B", points: 7 },
        { label: "C", value: "C", points: 6 },
        { label: "D", value: "D", points: 5 },
        { label: "E", value: "E", points: 4 },
        { label: "F", value: "F", points: 0 }
    ];

    const gradeMap = gradeScale.reduce(function (acc, item) {
        acc[item.value] = item.points;
        return acc;
    }, {});

    const state = {
        semesters: [],
        nextSemesterId: 1,
        nextCourseId: 1,
        lastResult: null
    };

    function generateSemesterId() {
        const id = state.nextSemesterId;
        state.nextSemesterId += 1;
        return id;
    }

    function generateCourseId() {
        const id = state.nextCourseId;
        state.nextCourseId += 1;
        return id;
    }

    function createCourse(overrides) {
        const course = {
            id: generateCourseId(),
            name: "",
            credits: "",
            grade: "A",
            points: gradeMap["A"]
        };
        if (overrides) {
            Object.assign(course, overrides);
        }
        return course;
    }

    function createSemester(overrides) {
        const semester = {
            id: generateSemesterId(),
            title: "",
            courses: [createCourse(), createCourse()]
        };
        if (overrides) {
            Object.assign(semester, overrides);
        }
        return semester;
    }

    function clearStatus() {
        statusBanner.classList.add("hidden");
        statusBanner.textContent = "";
        statusBanner.classList.remove("success", "warn", "error");
    }

    function setStatus(message, type) {
        statusBanner.textContent = message;
        statusBanner.classList.remove("hidden", "success", "warn", "error");
        if (type) {
            statusBanner.classList.add(type);
        }
    }

    function updateSemesterHelper() {
        const count = state.semesters.length;
        if (count === 0) {
            semesterSummary.textContent = "No semesters yet. Add one to start tracking.";
        } else if (count === 1) {
            semesterSummary.textContent = "Semester 1 ready. Add courses to get started.";
        } else {
            semesterSummary.textContent = `${count} semesters active. Populate courses and calculate your CGPA.`;
        }
    }

    function renderSemesters() {
        semesterContainer.innerHTML = "";
        if (!state.semesters.length) {
            const empty = document.createElement("div");
            empty.className = "empty-placeholder";
            empty.textContent = "No semesters yet. Use the Add Semester button to begin.";
            semesterContainer.appendChild(empty);
            updateSemesterHelper();
            return;
        }

        state.semesters.forEach(function (semester, index) {
            semester.title = `Semester ${index + 1}`;
            const card = document.createElement("div");
            card.className = "semester-card";
            card.dataset.semesterId = String(semester.id);

            const header = document.createElement("div");
            header.className = "semester-header";

            const title = document.createElement("div");
            title.className = "semester-title";
            title.textContent = semester.title;
            header.appendChild(title);

            const controls = document.createElement("div");
            controls.className = "semester-controls";

            const addCourseBtn = document.createElement("button");
            addCourseBtn.type = "button";
            addCourseBtn.className = "btn btn-outline btn-sm";
            addCourseBtn.textContent = "Add Course";
            addCourseBtn.addEventListener("click", function () {
                semester.courses.push(createCourse());
                renderSemesters();
            });
            controls.appendChild(addCourseBtn);

            if (state.semesters.length > 1) {
                const removeSemesterBtn = document.createElement("button");
                removeSemesterBtn.type = "button";
                removeSemesterBtn.className = "btn btn-outline btn-sm";
                removeSemesterBtn.textContent = "Remove";
                removeSemesterBtn.addEventListener("click", function () {
                    state.semesters = state.semesters.filter(function (item) {
                        return item.id !== semester.id;
                    });
                    renderSemesters();
                });
                controls.appendChild(removeSemesterBtn);
            }

            header.appendChild(controls);
            card.appendChild(header);

            const table = document.createElement("table");
            table.className = "course-table";

            const thead = document.createElement("thead");
            thead.innerHTML = "<tr><th>Course / Subject</th><th>Credits</th><th>Grade</th><th>Points</th><th></th></tr>";
            table.appendChild(thead);

            const tbody = document.createElement("tbody");
            if (!semester.courses.length) {
                const placeholder = document.createElement("tr");
                const cell = document.createElement("td");
                cell.colSpan = 5;
                cell.className = "empty-placeholder";
                cell.textContent = "No courses yet. Add one to this semester.";
                placeholder.appendChild(cell);
                tbody.appendChild(placeholder);
            } else {
                semester.courses.forEach(function (course) {
                    const row = document.createElement("tr");
                    row.dataset.courseId = String(course.id);

                    const nameCell = document.createElement("td");
                    const nameInput = document.createElement("input");
                    nameInput.type = "text";
                    nameInput.className = "course-input";
                    nameInput.placeholder = "Course name";
                    nameInput.value = course.name;
                    nameInput.addEventListener("input", function () {
                        course.name = nameInput.value;
                    });
                    nameCell.appendChild(nameInput);

                    const creditCell = document.createElement("td");
                    const creditInput = document.createElement("input");
                    creditInput.type = "number";
                    creditInput.min = "0";
                    creditInput.step = "0.5";
                    creditInput.className = "course-input";
                    creditInput.value = course.credits;
                    creditInput.placeholder = "0";
                    creditInput.addEventListener("input", function () {
                        course.credits = creditInput.value;
                    });
                    creditCell.appendChild(creditInput);

                    const gradeCell = document.createElement("td");
                    const gradeSelect = document.createElement("select");
                    gradeSelect.className = "grade-select";
                    gradeScale.forEach(function (grade) {
                        const option = document.createElement("option");
                        option.value = grade.value;
                        option.textContent = `${grade.label} (${grade.points})`;
                        if (grade.value === course.grade) {
                            option.selected = true;
                        }
                        gradeSelect.appendChild(option);
                    });
                    gradeSelect.addEventListener("change", function () {
                        course.grade = gradeSelect.value;
                        if (gradeMap.hasOwnProperty(course.grade)) {
                            course.points = gradeMap[course.grade];
                            pointsInput.value = String(course.points);
                        }
                    });
                    gradeCell.appendChild(gradeSelect);

                    const pointsCell = document.createElement("td");
                    const pointsInput = document.createElement("input");
                    pointsInput.type = "number";
                    pointsInput.step = "0.01";
                    pointsInput.min = "0";
                    pointsInput.max = "10";
                    pointsInput.className = "course-input";
                    pointsInput.value = course.points;
                    pointsInput.addEventListener("input", function () {
                        course.points = Number.parseFloat(pointsInput.value || "0");
                    });
                    pointsCell.appendChild(pointsInput);

                    const actionCell = document.createElement("td");
                    actionCell.style.textAlign = "right";
                    const removeBtn = document.createElement("button");
                    removeBtn.type = "button";
                    removeBtn.className = "remove-course-btn";
                    removeBtn.textContent = "Remove";
                    removeBtn.addEventListener("click", function () {
                        semester.courses = semester.courses.filter(function (item) {
                            return item.id !== course.id;
                        });
                        renderSemesters();
                    });
                    actionCell.appendChild(removeBtn);

                    row.appendChild(nameCell);
                    row.appendChild(creditCell);
                    row.appendChild(gradeCell);
                    row.appendChild(pointsCell);
                    row.appendChild(actionCell);

                    tbody.appendChild(row);
                });
            }

            table.appendChild(tbody);
            card.appendChild(table);
            semesterContainer.appendChild(card);
        });

        updateSemesterHelper();
    }

    function parseCourses() {
        const semestersSummary = [];
        const rows = [];
        let totalCredits = 0;
        let totalQuality = 0;
        let courseCount = 0;

        state.semesters.forEach(function (semester, index) {
            let semesterCredits = 0;
            let semesterQuality = 0;
            const cleanCourses = [];

            semester.courses.forEach(function (course) {
                const credits = Number.parseFloat(course.credits);
                const points = Number.parseFloat(course.points);
                if (Number.isFinite(credits) && credits > 0 && Number.isFinite(points) && points >= 0) {
                    semesterCredits += credits;
                    semesterQuality += credits * points;
                    totalCredits += credits;
                    totalQuality += credits * points;
                    courseCount += 1;
                    cleanCourses.push({
                        semester: semester.title || `Semester ${index + 1}`,
                        course: course.name || "Untitled Course",
                        credits,
                        grade: course.grade,
                        points
                    });
                }
            });

            const semesterGpa = semesterCredits > 0 ? semesterQuality / semesterCredits : 0;
            semestersSummary.push({
                id: semester.id,
                title: semester.title || `Semester ${index + 1}`,
                credits: semesterCredits,
                quality: semesterQuality,
                gpa: semesterGpa
            });
            rows.push(...cleanCourses);
        });

        const cgpa = totalCredits > 0 ? totalQuality / totalCredits : 0;

        return {
            semestersSummary,
            rows,
            cgpa,
            totalCredits,
            totalQuality,
            courseCount
        };
    }

    function formatNumber(value, decimals) {
        return Number.parseFloat(value).toFixed(decimals);
    }

    function determineStanding(cgpa) {
        if (cgpa >= 9) {
            return "Honours";
        }
        if (cgpa >= 8) {
            return "Distinction";
        }
        if (cgpa >= 7) {
            return "Merit";
        }
        if (cgpa >= 6) {
            return "Satisfactory";
        }
        if (cgpa > 0) {
            return "Needs Improvement";
        }
        return "–";
    }

    function renderResults(result) {
        cgpaValue.textContent = formatNumber(result.cgpa, 2);
        totalCreditsEl.textContent = result.totalCredits ? formatNumber(result.totalCredits, 2) : "0";
        courseCountEl.textContent = String(result.courseCount);

        if (result.semestersSummary.length) {
            const best = result.semestersSummary.reduce(function (acc, item) {
                if (!acc || item.gpa > acc.gpa) {
                    return item;
                }
                return acc;
            }, null);
            if (best && best.credits > 0) {
                bestSemesterEl.textContent = `${best.title} (${formatNumber(best.gpa, 2)})`;
            } else {
                bestSemesterEl.textContent = "–";
            }
        } else {
            bestSemesterEl.textContent = "–";
        }

        standingLabelEl.textContent = determineStanding(result.cgpa);

        semesterSummaryList.innerHTML = "";
        if (result.semestersSummary.length) {
            result.semestersSummary.forEach(function (item, index) {
                const pill = document.createElement("div");
                pill.className = "semester-pill";
                const name = document.createElement("span");
                name.innerHTML = `<strong>${item.title || `Semester ${index + 1}`}</strong>`;
                const value = document.createElement("span");
                value.textContent = item.credits > 0 ? `${formatNumber(item.gpa, 2)} GPA` : "N/A";
                pill.appendChild(name);
                pill.appendChild(value);
                semesterSummaryList.appendChild(pill);
            });
        }

        resultsTableBody.innerHTML = "";
        if (!result.rows.length) {
            const emptyRow = document.createElement("tr");
            emptyRow.className = "empty-row";
            const cell = document.createElement("td");
            cell.colSpan = 5;
            cell.textContent = "Add courses and run the calculator to see detailed results.";
            emptyRow.appendChild(cell);
            resultsTableBody.appendChild(emptyRow);
        } else {
            result.rows.forEach(function (row) {
                const tr = document.createElement("tr");
                tr.innerHTML = `
                    <td>${row.semester}</td>
                    <td>${row.course}</td>
                    <td>${formatNumber(row.credits, row.credits % 1 === 0 ? 0 : 2)}</td>
                    <td>${row.grade}</td>
                    <td>${formatNumber(row.points, 2)}</td>
                `;
                resultsTableBody.appendChild(tr);
            });
        }
    }

    function calculateCgpa(showStatus) {
        clearStatus();
        const result = parseCourses();
        if (!result.courseCount) {
            if (showStatus) {
                setStatus("Add at least one course with credits and grade points before calculating.", "warn");
            }
            return null;
        }

        renderResults(result);
        setStatus(`Calculated CGPA ${formatNumber(result.cgpa, 2)} across ${result.courseCount} courses.`, "success");

        state.lastResult = {
            generatedAt: new Date(),
            summary: result
        };
        return state.lastResult;
    }

    function copySummary() {
        const result = state.lastResult || calculateCgpa(false);
        if (!result) {
            setStatus("Calculate your CGPA before copying the summary.", "warn");
            return;
        }

        const { summary } = result;
        const lines = [];
        lines.push(`CGPA Summary (${result.generatedAt.toLocaleString()})`);
        lines.push(`Overall CGPA: ${formatNumber(summary.cgpa, 2)}`);
        lines.push(`Total Credits: ${formatNumber(summary.totalCredits, 2)}`);
        lines.push(`Courses Count: ${summary.courseCount}`);
        lines.push("");
        summary.semestersSummary.forEach(function (item) {
            const label = item.title;
            const gpa = item.credits > 0 ? formatNumber(item.gpa, 2) : "N/A";
            const credits = formatNumber(item.credits, item.credits % 1 === 0 ? 0 : 2);
            lines.push(`${label}: GPA ${gpa} | Credits ${credits}`);
        });
        const text = lines.join("\n");

        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text).then(function () {
                setStatus("Summary copied to clipboard.", "success");
            }).catch(function () {
                setStatus("Clipboard access denied. Copy manually from the table below.", "warn");
            });
        } else {
            setStatus("Clipboard API unavailable in this browser.", "warn");
        }
    }

    function downloadReport() {
        const result = state.lastResult || calculateCgpa(false);
        if (!result) {
            setStatus("Calculate your CGPA before downloading a report.", "warn");
            return;
        }
        const { summary } = result;
        const lines = [];
        lines.push("CGPA Report");
        lines.push(`Generated: ${result.generatedAt.toISOString()}`);
        lines.push(`Overall CGPA: ${formatNumber(summary.cgpa, 2)}`);
        lines.push(`Total Credits: ${formatNumber(summary.totalCredits, 2)}`);
        lines.push(`Courses Count: ${summary.courseCount}`);
        lines.push("");
        lines.push("Semester Breakdown:");
        summary.semestersSummary.forEach(function (item) {
            const gpa = item.credits > 0 ? formatNumber(item.gpa, 2) : "N/A";
            lines.push(`- ${item.title}: GPA ${gpa} | Credits ${formatNumber(item.credits, item.credits % 1 === 0 ? 0 : 2)}`);
        });
        lines.push("");
        lines.push("Courses:");
        summary.rows.forEach(function (row) {
            lines.push(`- ${row.semester} | ${row.course} | Credits ${formatNumber(row.credits, row.credits % 1 === 0 ? 0 : 2)} | Grade ${row.grade} | Points ${formatNumber(row.points, 2)}`);
        });

        const blob = new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement("a");
        anchor.href = url;
        anchor.download = "cgpa-report.txt";
        document.body.appendChild(anchor);
        anchor.click();
        document.body.removeChild(anchor);
        URL.revokeObjectURL(url);
        setStatus("Report downloaded as cgpa-report.txt.", "success");
    }

    function loadSamplePlan() {
        state.semesters = [
            createSemester({
                courses: [
                    createCourse({ name: "Mathematics I", credits: "4", grade: "A", points: gradeMap["A"] }),
                    createCourse({ name: "Programming Basics", credits: "3", grade: "A+", points: gradeMap["A+"] }),
                    createCourse({ name: "Physics", credits: "4", grade: "B+", points: gradeMap["B+"] })
                ]
            }),
            createSemester({
                courses: [
                    createCourse({ name: "Data Structures", credits: "4", grade: "A+", points: gradeMap["A+"] }),
                    createCourse({ name: "Discrete Math", credits: "3", grade: "A", points: gradeMap["A"] }),
                    createCourse({ name: "Communication Skills", credits: "2", grade: "B", points: gradeMap["B"] })
                ]
            }),
            createSemester({
                courses: [
                    createCourse({ name: "Algorithms", credits: "4", grade: "A", points: gradeMap["A"] }),
                    createCourse({ name: "Computer Networks", credits: "3", grade: "B+", points: gradeMap["B+"] }),
                    createCourse({ name: "Database Systems", credits: "4", grade: "A+", points: gradeMap["A+"] })
                ]
            })
        ];
        renderSemesters();
        calculateCgpa(false);
        setStatus("Sample plan loaded. Adjust credits or grades to match your record.", "success");
    }

    function clearAll() {
        state.semesters = [createSemester()];
        state.lastResult = null;
        renderSemesters();
        renderResults({
            semestersSummary: [],
            rows: [],
            cgpa: 0,
            totalCredits: 0,
            totalQuality: 0,
            courseCount: 0
        });
        clearStatus();
        setStatus("Cleared semesters and results. Start fresh!", "success");
    }

    function initialize() {
        addSemesterBtn.addEventListener("click", function () {
            state.semesters.push(createSemester());
            renderSemesters();
        });

        calculateBtn.addEventListener("click", function () {
            calculateCgpa(true);
        });

        copySummaryBtn.addEventListener("click", copySummary);
        downloadReportBtn.addEventListener("click", downloadReport);
        loadSampleBtn.addEventListener("click", loadSamplePlan);
        clearAllBtn.addEventListener("click", clearAll);

        state.semesters.push(createSemester());
        renderSemesters();
        renderResults({
            semestersSummary: [],
            rows: [],
            cgpa: 0,
            totalCredits: 0,
            totalQuality: 0,
            courseCount: 0
        });
    }

    initialize();
})();
