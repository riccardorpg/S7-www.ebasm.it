<?php

namespace App\Service;

use App\Entity\Slave\Practice;
use Symfony\Component\Mailer\Exception\TransportExceptionInterface;
use Symfony\Component\Mailer\MailerInterface;
use Symfony\Component\Mime\Email;
use Symfony\Component\DependencyInjection\ParameterBag\ParameterBagInterface;

/**
 * 12.3.2.7 Notifica di aggiornamento file su una pratica.
 *
 * L'invio è già completo: con MAILER_DSN su `null://null` (impostazione attuale) il
 * messaggio non parte, ma il codice non cambia quando verrà configurato un DSN vero.
 */
class PracticeNotifier
{
    public function __construct(
        private readonly MailerInterface $mailer,
        private readonly ParameterBagInterface $params,
    ) {
    }

    /**
     * Destinatari possibili per una pratica: le parti, il notaio assegnato e lo staff
     * abilitato. Chiave = email, valore = etichetta mostrata nella tendina.
     *
     * @return array<string, string>
     */
    public function recipientsFor(Practice $practice): array
    {
        $recipients = [];

        foreach ([['Venditore', $practice->getSeller()], ['Acquirente', $practice->getBuyer()]] as [$role, $customer]) {
            $email = $customer?->getEmail();
            if ($email) {
                $recipients[$email] = sprintf('%s — %s', $customer->getFullName(), $role);
            }
        }

        if ($practice->getNotaryEmail()) {
            $recipients[$practice->getNotaryEmail()] = $practice->getNotaryEmail() . ' — Notaio';
        }

        foreach ($practice->getStaff() as $member) {
            if ($member->getEmail()) {
                $recipients[$member->getEmail()] = $member->getFullName() . ' — Staff';
            }
        }

        return $recipients;
    }

    /**
     * Invia la notifica. Ritorna false se il trasporto rifiuta il messaggio: la
     * schermata lo segnala invece di far fallire la richiesta.
     */
    public function notifyFileUpdate(Practice $practice, string $to, string $message, string $senderName): bool
    {
        $email = (new Email())
            ->from((string) $this->params->get('email_noreply'))
            ->to($to)
            ->subject(sprintf('Aggiornamento documenti — pratica %s', $practice->getNumber()))
            ->text($this->body($practice, $message, $senderName));

        try {
            $this->mailer->send($email);

            return true;
        } catch (TransportExceptionInterface) {
            return false;
        }
    }

    private function body(Practice $practice, string $message, string $senderName): string
    {
        $lines = [
            sprintf('Pratica %s — %s', $practice->getNumber(), $practice->getTypeLabel()),
        ];
        if ($practice->getAddress()) {
            $lines[] = 'Immobile: ' . $practice->getAddress();
        }
        $lines[] = '';
        $lines[] = $message;
        $lines[] = '';
        $lines[] = '— ' . $senderName;

        return implode("\n", $lines);
    }
}
