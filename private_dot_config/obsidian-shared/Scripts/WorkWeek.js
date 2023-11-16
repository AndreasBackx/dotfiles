async function Week(dv, obsidian) {
    //console.clear();
    const peopleFolderName = "@";

    const { createButton } = app.plugins.plugins["buttons"];
    const tp =
        app.plugins.plugins["templater-obsidian"].templater
            .current_functions_object;

    let currentWeek = dv.current().week;

    console.log({ templater: app.plugins.plugins["templater-obsidian"] });

    function convertToUnicode(inputString) {
        if (inputString == null) {
            return null;
        }
        const parts = inputString.split("//")[1].split("-");
        const codePoints = parts.map((hex) => parseInt(hex, 16));
        const unicodeString = String.fromCodePoint(...codePoints);
        return unicodeString;
    }

    function getPersonDisplay(personPage) {
        let sticker = convertToUnicode(personPage.sticker);
        return `${sticker} ${personPage.aliases[0]}`;
    }

    function getMeetingDisplay(meetingPage, personPage) {
        let link = dv.fileLink(
            meetingPage.file.path,
            false,
            getPersonDisplay(personPage)
        );
        let weekday = dv
            .date(meetingPage.file.frontmatter.date || tp.date.now())
            ?.toFormat("EEEE");
        return `${link} on ${weekday}`;
    }

    // dv.list(
    //     dv
    //         .pages('"Meetings/1-1"')
    //         .filter((page) => {
    //             console.log({
    //                 page,
    //                 week: page.date && page.date.toFormat("W"),
    //             });
    //             return page.date && page.date.toFormat("W") == currentWeek;
    //         })
    //         .map((page) => {
    //             return getMeetingDisplay(
    //                 page,
    //                 dv.page(`${peopleFolderName}/${participants[0]}.md`)
    //             );
    //             /*let person = dv.page(`People/${page.participants[0]}.md`);
    // 	let link = dv.fileLink(page.file.path, false, `${person.sticker} ${person.name}`);
    // 	let weekday = dv.date(page.file.frontmatter.date).toFormat('EEEE');
    // 	console.log({page, personPath: `"People/${page.participants[0]}"`, person, link, weekday});
    // 	return `${link} on ${weekday}`;*/
    //         })
    // );

    let people = dv.pages(`"${peopleFolderName}"`);
    let peopleNames = await people.map((page) => getPersonDisplay(page));
    let peoplePages = await people;

    createButton({
        app,
        el: dv.el("div", ""),
        args: {
            name: "+ 1:1",
            class: "none",
        },
        clickOverride: {
            click: async () => {
                console.log({ tp });
                let personPage = await tp.system.suggester(
                    peopleNames.values,
                    peoplePages.values,
                    false,
                    "With whom?"
                );
                if (personPage == null) {
                    new Notice("Select something, you doofus!");
                    return;
                }

                const currentFile = app.workspace.getActiveViewOfType(
                    obsidian.MarkdownView
                ).file;
                const content = await app.vault.read(currentFile);
                const lines = content.split("\n");

                let position = -1;
                for (const [index, line] of lines.entries()) {
                    if (line !== "```dataviewjs // INSERT ABOVE") {
                        continue;
                    }
                    console.info(`Found dataview at ${index}`);
                    for (
                        var previousIndex = index - 1;
                        previousIndex >= 0;
                        previousIndex--
                    ) {
                        const previousLine = lines[previousIndex];
                        if (!previousLine) continue;
                        switch (previousLine[0]) {
                            case "*":
                            case "-":
                                position = previousIndex;
                                console.info(`Found at: ${position}`);
                                break;
                            case "#":
                                position = previousIndex + 1;
                                break;
                            default:
                                continue;
                        }
                        break;
                    }
                    break;
                }

                let template = tp.file.find_tfile("Templates/1-1");
                let folderPath = `Meetings/1-1/${personPage.file.name}`;
                let folder = app.vault.getAbstractFileByPath(folderPath);
                if (folder == null) {
                    console.info(`Creating folder ${folderPath}`);
                    await app.vault.createFolder(folderPath);
                    folder = app.vault.getAbstractFileByPath(folderPath);
                }

                console.debug("Creating template in folder: ", {
                    template,
                    folder,
                });
                let createdFile = await tp.file.create_new(
                    template,
                    tp.date.now(),
                    true,
                    folder
                );

                console.debug("Created file: ", createdFile);

                if (position <= 0) {
                    new Notice("Could not find list of meetings!");
                } else {
                    const tfile = dv.current().file;
                    console.info({ personPage });
                    const display = getMeetingDisplay(
                        dv.page(createdFile.path),
                        personPage
                    );
                    let inbetween = [`* ${display}`];
                    if (lines[position + 1] !== "") {
                        inbetween.push("");
                    }
                    const newLines = [
                        ...lines.slice(0, position + 1),
                        ...inbetween,
                        ...lines.slice(position + 1),
                    ];
                    const newContent = newLines.join("\n");
                    try {
                        await app.vault.modify(tfile, newContent);
                    } catch (error) {}
                }

                console.info({ createdFile });
            },
            params: [],
        },
    });
}

module.exports = Week;
