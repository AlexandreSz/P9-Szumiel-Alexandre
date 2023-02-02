/**
 * @jest-environment jsdom
 */

import { screen, waitFor, fireEvent } from "@testing-library/dom"
import BillsUI from "../views/BillsUI.js"
import Bills from "../containers/Bills.js";
import { bills } from "../fixtures/bills.js"
import { ROUTES, ROUTES_PATH } from "../constants/routes"
import { localStorageMock } from "../__mocks__/localStorage.js";
import mockStore from "../__mocks__/store.js"
import router from "../app/Router.js";

jest.mock("../app/store", () => mockStore)

describe("Given I am connected as an employee", () => {
        describe("When I am on Bills Page", () => {
            test("Then bill icon in vertical layout should be highlighted", async() => {
                    // TEST : L'icône de la NDF dans la barre verticale doit être mise en surbrillance
                    Object.defineProperty(window, 'localStorage', { value: localStorageMock })
                    window.localStorage.setItem('user', JSON.stringify({
                        type: 'Employee'
                    }))
                    const root = document.createElement("div")
                    root.setAttribute("id", "root")
                    document.body.append(root)
                    router()
                    window.onNavigate(ROUTES_PATH.Bills)
                    await waitFor(() => screen.getByTestId('icon-window'))
                    const windowIcon = screen.getByTestId('icon-window')
                        //to-do write expect expression
                        // Jest va tester si le résultat de expect() correspond au “matcher”.
                    const iconActivated = windowIcon.classList.contains('active-icon')
                    expect(iconActivated).toBeTruthy()
                })
                // TEST : Les factures doivent être commandées du plus ancien au plus récent
            test("Then bills should be ordered from earliest to latest", () => {
                document.body.innerHTML = BillsUI({ data: bills })
                const dates = screen.getAllByText(/^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i).map(a => a.innerHTML)
                const antiChrono = (a, b) => ((a < b) ? 1 : -1)
                const datesSorted = [...dates].sort(antiChrono)
                expect(dates).toEqual(datesSorted)
            })
        })
        describe("When I am on Bills page with an error", () => {
            // TEST : Page erreur doit s'afficher
            test("Then Error page should be displayed", () => {
                const html = BillsUI({ data: bills, error: true });
                document.body.innerHTML = html;
                const hasError = screen.getAllByText("Erreur");
                expect(hasError).toBeTruthy();
            })
        })
        describe("When I am on Bills page and it's loading", () => {
            // TEST : La page doit s'afficher après chargement
            test("Then Loading page should be displayed", () => {
                const html = BillsUI({ data: bills, loading: true });
                document.body.innerHTML = html;
                const isLoading = screen.getAllByText("Loading...");
                expect(isLoading).toBeTruthy();
            })
        })
        describe("When I click on button 'Nouvelle note de frais'", () => {
            // TEST : Page nouvelle Note de Frais doit s'afficher
            test("Then I should be sent on the new bill page", () => {
                Object.defineProperty(window, 'localStorage', { value: localStorageMock })
                window.localStorage.setItem('user', JSON.stringify({ type: 'Employee' }))
                const html = BillsUI({ data: bills })
                document.body.innerHTML = html
                const onNavigate = (pathname) => {
                    document.body.innerHTML = ROUTES({ pathname })
                }
                const mockBills = new Bills({ document, onNavigate, localStorage, store: null });
                const btnNewBill = screen.getByTestId('btn-new-bill');

                // Simulation de la fonction handleClick pour Nouvelle NDF
                const mockFunctionHandleClick = jest.fn(mockBills.handleClickNewBill);
                btnNewBill.addEventListener('click', mockFunctionHandleClick)
                    // FireEvent : Initialise la méthode
                fireEvent.click(btnNewBill)
                expect(mockFunctionHandleClick).toHaveBeenCalled();
                expect(mockFunctionHandleClick).toHaveBeenCalledTimes(1);
            })
        })
        describe("When I click on first eye icon", () => {
            // Test : La modale doit s'ouvrir
            test("Then modal should open", () => {
                Object.defineProperty(window, localStorage, { value: localStorageMock })
                window.localStorage.setItem("user", JSON.stringify({ type: 'Employee' }))
                    // on ajoute le Html et la navigation
                const html = BillsUI({ data: bills })
                document.body.innerHTML = html
                const onNavigate = (pathname) => {
                    document.body.innerHTML = ROUTES({ pathname })
                }
                const billsContainer = new Bills({ document, onNavigate, localStorage: localStorageMock, store: null });

                //Simulation de la modale pour l'ouverture au clic
                $.fn.modal = jest.fn();

                //Simulation de la fonction handleClickIconEye 
                const handleClickIconEye = jest.fn(() => { billsContainer.handleClickIconEye });
                const firstEyeIcon = screen.getAllByTestId("icon-eye")[0];
                firstEyeIcon.addEventListener("click", handleClickIconEye)
                fireEvent.click(firstEyeIcon)
                expect(handleClickIconEye).toHaveBeenCalled();
                expect($.fn.modal).toHaveBeenCalled();
            })
        })
    })
    /////////////////////////////////////////////////////////
    ////////////////////////////////////////////////////////
    // --- TEST INTEGRATION GET METHOD
describe('Given I am connected as an employee', () => {
    describe('When I am on Bills Page', () => {
        // TEST : récupère les factures de l'API simulée avec GET (récupération des données)
        test("fetches bills from mock API GET", async() => {
            localStorage.setItem("user", JSON.stringify({ type: "Employee", email: "a@a" }));
            const root = document.createElement("div")
            root.setAttribute("id", "root")
            document.body.append(root)
            router()
            window.onNavigate(ROUTES_PATH.Bills)

            // appelle la list() bills 
            const mockedBill = mockStore.bills()
            const bill = jest.spyOn(mockedBill, "list")
            const billresponse = await mockedBill.list()

            // vérifie qu'on soit bien sur la page "Mes notes de frais"
            expect(await waitFor(() => screen.getByText('Mes notes de frais'))).toBeTruthy()

            expect(bill).toHaveBeenCalledTimes(1);
            expect(billresponse.length).toBe(4);
        })
    })

    // Lorsqu'une erreur se produit sur l'API
    describe("When an error occurs on API", () => {
        // beforeEach()est exécuté avant chaque test describe. gère le code Asynchrone / portée plus grande
        // Jest.spyOn simule la fonction qu'on a besoin et conserve l'implémentation d'origine. mock une méthode dans un objet.
        beforeEach(() => {
                jest.spyOn(mockStore, "bills")
                Object.defineProperty(window, 'localStorage', { value: localStorageMock })
                localStorage.setItem('user', JSON.stringify({ type: 'Employee', email: "a@a" }))
                const root = document.createElement("div")
                root.setAttribute("id", "root")
                document.body.appendChild(root)
                router()
            })
            // TEST : récupère les factures d'une API et échoue avec une erreur 404
        test("fetches bills from an API and fails with 404 message error", async() => {
            // mockImplementationOnce : récupère la boucle une fois
            mockStore.bills.mockImplementationOnce(() => {
                return {
                    list: () => {
                        return Promise.reject(new Error("Erreur 404"))
                    }
                }
            })
            const html = BillsUI({ error: "Erreur 404" });
            document.body.innerHTML = html;
            const message = await screen.getByText(/Erreur 404/);
            expect(message).toBeTruthy();
        })

        // TEST : récupère les factures d'une API et échoue avec une erreur 500
        test("fetches messages from an API and fails with 500 message error", async() => {
            mockStore.bills.mockImplementationOnce(() => {
                return {
                    list: () => {
                        return Promise.reject(new Error("Erreur 500"))
                    }
                }
            })
            const html = BillsUI({ error: "Erreur 500" });
            document.body.innerHTML = html;
            const message = await screen.getByText(/Erreur 500/);
            expect(message).toBeTruthy();
        })
    })
})