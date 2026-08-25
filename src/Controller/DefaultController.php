<?php

namespace App\Controller;

use App\Entity\Master\Company;
use App\Entity\Master\DemoRequest;
use App\Service\AppMailer;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;

/**
 * Parte esterna (pubblica) del sito: homepage marketing, form contatti/demo, pagine legali.
 *
 * I submit validano CSRF e campi obbligatori, notificano via e-mail (14.1 / 14.2) e
 * mostrano un flash di conferma. TODO: verifica reCaptcha server-side.
 */
class DefaultController extends AbstractController
{
    #[Route('/', name: 'homepage', methods: ['GET'])]
    public function home(Request $request): Response
    {
        // Sezione da raggiungere in scroll (impostata da homepage_with_section quando si
        // arriva da un'altra pagina). Consumata una sola volta.
        $section = null;
        if ($request->hasSession() && $request->getSession()->has('section')) {
            $section = (string) $request->getSession()->get('section');
            $request->getSession()->remove('section');
        }

        return $this->render('default/index.html.twig', [
            'section' => $section,
        ]);
    }

    #[Route('/home/{section}', name: 'homepage_with_section', methods: ['GET'])]
    public function indexWithSection(Request $request, string $section): Response
    {
        // Salva la sezione in sessione e reindirizza alla homepage, che vi scorrerà.
        $request->getSession()->set('section', $section);

        return $this->redirectToRoute('homepage');
    }

    #[Route('/contatti/invia', name: 'contact_submit', methods: ['POST'])]
    public function contactSubmit(Request $request, AppMailer $mailer): Response
    {
        if (!$this->isCsrfTokenValid('contact', (string) $request->request->get('_csrf_token'))) {
            $this->addFlash('danger', 'Sessione scaduta, riprova a inviare il modulo.');

            // #contatti-contact: la homepage riapre il modulo contatti (vedi 1.7.0).
            return $this->redirect($this->generateUrl('homepage') . '#contatti-contact', Response::HTTP_SEE_OTHER);
        }

        $name = trim((string) $request->request->get('name'));
        $surname = trim((string) $request->request->get('surname'));
        $email = trim((string) $request->request->get('email'));
        $message = trim((string) $request->request->get('message'));

        if ($name === '' || $surname === '' || !filter_var($email, FILTER_VALIDATE_EMAIL) || $message === '') {
            $this->addFlash('danger', 'Controlla i campi: nome, cognome, e-mail valida e messaggio sono obbligatori.');

            return $this->redirect($this->generateUrl('homepage') . '#contatti-contact', Response::HTTP_SEE_OTHER);
        }

        // 14.1 Notifica interna della richiesta. TODO: verifica reCaptcha server-side.
        $mailer->contactRequest($name, $surname, $email, $message);
        $this->addFlash('success', 'Grazie ' . $name . '! Abbiamo ricevuto la tua richiesta e ti risponderemo al più presto.');

        return $this->redirect($this->generateUrl('homepage') . '#contatti', Response::HTTP_SEE_OTHER);
    }

    #[Route('/demo/richiedi', name: 'demo_request_submit', methods: ['POST'])]
    public function demoRequestSubmit(Request $request, EntityManagerInterface $em, AppMailer $mailer): Response
    {
        if (!$this->isCsrfTokenValid('demo', (string) $request->request->get('_csrf_token'))) {
            $this->addFlash('danger', 'Sessione scaduta, riprova a inviare il modulo.');

            // #contatti-demo: la homepage riapre il modulo demo (vedi 1.7.0).
            return $this->redirect($this->generateUrl('homepage') . '#contatti-demo', Response::HTTP_SEE_OTHER);
        }

        $accountType = (string) $request->request->get('account_type');
        $email = trim((string) $request->request->get('email'));
        $emailConfirm = trim((string) $request->request->get('email_confirm'));
        $businessName = trim((string) $request->request->get('business_name'));
        $address = trim((string) $request->request->get('address'));
        $civic = trim((string) $request->request->get('civic'));
        $city = trim((string) $request->request->get('city'));
        $zip = trim((string) $request->request->get('zip'));

        $errors = [];
        if (!in_array($accountType, [Company::TYPE_COMPANY, Company::TYPE_PROFESSIONAL], true)) {
            $errors[] = 'Seleziona il tipo di account.';
        }
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            $errors[] = 'Inserisci un indirizzo e-mail valido.';
        } elseif ($email !== $emailConfirm) {
            $errors[] = 'Le due e-mail non coincidono.';
        }
        if ($businessName === '' || $address === '' || $civic === '' || $city === '') {
            $errors[] = 'Compila tutti i campi anagrafici obbligatori.';
        }
        if (!preg_match('/^\d{5}$/', $zip)) {
            $errors[] = 'Il CAP deve essere di 5 cifre.';
        }

        if ($errors !== []) {
            $this->addFlash('danger', implode(' ', $errors));

            return $this->redirect($this->generateUrl('homepage') . '#contatti-demo', Response::HTTP_SEE_OTHER);
        }

        // Persistenza come richiesta demo (lead) da evadere in area admin (allarme 6.1.1).
        // TODO: verifica reCaptcha server-side.
        $demo = new DemoRequest();
        $demo->setAccountType($accountType)
            ->setEmail($email)
            ->setBusinessName($businessName)
            ->setAddress($address)
            ->setCivic($civic)
            ->setCity($city)
            ->setZip($zip)
            ->setSdi(trim((string) $request->request->get('sdi')) ?: null)
            ->setPec(trim((string) $request->request->get('pec')) ?: null);
        $em->persist($demo);
        $em->flush();

        // 14.2 Avvisa l'indirizzo interno: la richiesta è anche un allarme in scrivania.
        $mailer->demoRequest($demo);

        $this->addFlash('success', 'Richiesta demo ricevuta! Ti invieremo a breve le istruzioni di accesso all\'indirizzo ' . $email . '.');

        return $this->redirect($this->generateUrl('homepage') . '#contatti', Response::HTTP_SEE_OTHER);
    }

    #[Route('/cookie-policy', name: 'legal_cookie', methods: ['GET'])]
    public function cookie(): Response
    {
        return $this->render('default/legal.html.twig', [
            'title' => 'Normativa cookie',
        ]);
    }

    #[Route('/privacy-policy', name: 'legal_privacy', methods: ['GET'])]
    public function privacy(): Response
    {
        return $this->render('default/legal.html.twig', [
            'title' => 'Normativa privacy',
        ]);
    }

    #[Route('/termini-e-condizioni', name: 'legal_terms', methods: ['GET'])]
    public function terms(): Response
    {
        return $this->render('default/legal.html.twig', [
            'title' => 'Termini e condizioni di utilizzo',
        ]);
    }
}
